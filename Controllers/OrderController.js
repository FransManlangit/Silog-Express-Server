const OderModel = require ("../Models/Order");
const OderItemsModel = require ("../Models/Order-Item");
const ProductModel = require ("../Models/Product");
const UserModel = require ("../Models/User");
const ErrorHandler = require ("../Utils/ErrorHandler");
const sendtoEmail = require ("../Utils/SendToMail");
const PaymongoToken = require ("../Models/PaymongoToken");


exports.newOrder = async (req, res, next) => {
    try {
        const validationErrors = [];
        const user = await UserModel.findById(req.body.user);

        if (!user) {
            return next(new ErrorHandler("User not found", 404));
        }

        const orderItemsDetails = [];

        const orderItemsIds = await Promise.all(
            req.body.orderItems.map(async (orderItem) => {
                const product = await ProductModel.findById(orderItem.product);

                if (!product) {
                    validationErrors.push(`Product with ID ${orderItem.id} not found.`);
                    return null;
                }

                if (product.stock <= 0) {
                    validationErrors.push(`Not Available Today ${product.name}.`);
                    return null;
                }

               

                if (req.body.paymentMethod === "Cash On Delivery") {
                    const stockChange = -orderItem.quantity;

                    product.stockLogs.push({
                        name: product.name,
                        quantity: stockChange,
                        status: "Unavailable at the Moment",
                        by: `${user.firstname} - ${user.role}`,
                    });

                    if (product) {
                        product.stock -= orderItem.quantity;
                        await product.save();
                    }
                }

                let newOrderItem = new OderItemsModel({
                    quantity: orderItem.quantity,
                    product: orderItem.product,
                });

                orderItemsDetails.push({
                    productName: product.name,
                    quantity: orderItem.quantity,
                    price: product.price,
                });

                newOrderItem = await newOrderItem.save();
                return newOrderItem._id;
            })
        );

        if (validationErrors.length > 0) {
            console.log(validationErrors);
            return res.status(400).send(validationErrors.join("\n"));
        }

        const initialOrderStatus = {
            status: req.body.paymentMethod === "GCash" ? "TOPAY" : "Pending",
            timestamp: new Date(),
            message:
                req.body.paymentMethod === "GCash"
                    ? "Order placed successfully. Proceed to payment using GCash."
                    : "Order placed successfully.",
        };

        let order = new OrderModel({
            orderItems: orderItemsIds,
            user: req.body.user,
            fullname: req.body.fullname,
            mobilenumber: req.body.mobilenumber,
            region: req.body.region,
            province: req.body.province,
            city: req.body.city,
            barangay: req.body.barangay,
            postalcode: req.body.postalcode,
            address: req.body.address,
            orderStatus: [initialOrderStatus],
            totalPrice: req.body.totalPrice,
            customerUser: req.body.customerUser,
            employeeUser: req.body.employeeUser,
            dateOrdered: req.body.dateOrdered,
            dateReceived: req.body.dateReceived,
            paymentMethod: req.body.paymentMethod,
        });

        order = await order.save();

        const orderObject = order.toObject();

        console.log(orderItemsDetails, "this is order");

        const paymongoToken = await new PaymongoToken({
            orderId: order._id,
            token: crypto.randomBytes(32).toString("hex"),
            verificationTokenExpire: new Date(Date.now() + 2 * 60 * 1000),
        }).save();

        let emailContent = `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 15px; justify-content: center; align-items: center; height: 40vh;">
    <div style="background-color: #ffffff; padding: 20px; border-radius: 5px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); text-align: center;">
        <h1 style="font-size: 24px; color: #333; margin-bottom: 20px;">Order Details</h1>
        <p style="font-size: 16px; color: #555;">Hello ${user.firstname},</p>
        <p style="font-size: 16px; color: #555;">Thank you for your order with <strong>teamPOOR - Motorcycle Parts & Services</strong>.</p>
        
        <!-- Order items table -->
        <table style="width: 100%; margin-top: 20px; border-collapse: collapse;">
            <thead>
                <tr>
                    <th style="padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Product Name</th>
                    <th style="padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Quantity</th>
                    <th style="padding: 10px; background-color: #f2f2f2; border: 1px solid #ddd;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${orderItemsDetails.map(item => `
                    <tr>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.productName}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.quantity}</td>
                        <td style="padding: 10px; border: 1px solid #ddd;">${item.price}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        <!-- End of order items table -->
        
        <p style="font-size: 16px; color: #555; margin-top: 20px;">If you have any questions or concerns about your order, please feel free to contact us.</p>
        <p style="font-size: 16px; color: #555;">Best regards,<br>teamPOOR - Motorcycle Parts & Services</p>
    </div>
</div>

    `;

        await sendtoEmail(
            user.email,
            "teamPOOR - Order Confirmation",
            emailContent,
            true
        );

        if (req.body.paymentMethod === "GCash") {
            const temporaryLink = `${process.env.FRONTEND_URL}/paymongo-gcash/${paymongoToken.token}/${order._id}`;
            console.log();

            const checkoutUrl = await handlePayMongo(
                orderItemsDetails,
                temporaryLink
            );

            console.log(checkoutUrl, "checkout");

            return res.json({ checkoutUrl });
        }

        return res.send(orderObject);
    } catch (error) {
        console.error(error);
        return res.status(500).send("Internal Server Error");
    }
};


const handlePayMongo = async (orderItemsDetails, temporaryLink) => {
    try {
        const lineItems = orderItemsDetails.map((orderItem) => ({
            currency: "PHP",
            amount: orderItem.price * orderItem.quantity * 100,
            description: orderItem.productName,
            name: orderItem.productName,
            quantity: orderItem.quantity,
        }));

        console.log(lineItems, "line");

        const options = {
            method: "POST",
            url: "https://api.paymongo.com/v1/checkout_sessions",
            headers: {
                accept: "application/json",
                "Content-Type": "application/json",
                authorization:
                    "Basic c2tfdGVzdF9VUkhhUGhjQTJzeHVvQXJxV1V2Z25Ya2s6c2tfdGVzdF9VUkhhUGhjQTJzeHVvQXJxV1V2Z25Ya2s=",
            },
            data: {
                data: {
                    attributes: {
                        send_email_receipt: true,
                        show_description: true,
                        show_line_items: true,
                        line_items: lineItems,
                        payment_method_types: ["gcash"],
                        description: "Order payment",
                        success_url: `${temporaryLink}`,
                    },
                },
            },
        };

        console.log(options, "options");

        const response = await axios.request(options);

        console.log(response, "rees");
        const checkoutUrl = response.data.data.attributes.checkout_url;

        return checkoutUrl;
    } catch (error) {
        console.log("Error creating PayMongo checkout session:", error);

    }
};

