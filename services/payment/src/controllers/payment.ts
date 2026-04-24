import { authenticationRequest } from "../middlewares/auth.js";
import { Response } from "express";
import { pool } from "../utils/db.js";
import { instance } from "../index.js";
import crypto from "crypto";
import { log } from "console";

export const checkOut = async (req: authenticationRequest, res: Response) => {
  const user = req.user;

  if (!user) {
    return res.status(404).json({
      message: "Authentication required",
    });
  }
  const user_id = user.user_id;

  const userr = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [
    user_id,
  ]);

  const subTime = userr.rows[0]?.subscription_end_date
    ? new Date(userr.rows[0].subscription_end_date).getTime()
    : 0;
  const now = Date.now();
  const isSubscribed = subTime > now;
  if (isSubscribed) {
    return res.status(400).json({
      message: "You already have an active subscription",
    });
  }

  const options = {
    amount: Number(119 * 100),
    currency: "INR",
    notes: {
      user_id: user_id.toString(),
    },
  };

  const order = await instance.orders.create(options);
  res.status(201).json({
    order,
  });
};
export const paymentVerification = async (
  req: authenticationRequest,
  res: Response,
) => {
  const user = req.user;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body.toString())
    .digest("hex");
  const isAuthentic = expectedSignature === razorpay_signature;
  console.log("expectedSignature", expectedSignature);
  console.log("razorpay_signature", razorpay_signature);

  if (isAuthentic) {
    const now = new Date();

    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    const expiryDate = new Date(now.getTime() + thirtyDays);
    const updatedUser = await pool.query(
      `UPDATE users SET subscription_end_date = $1, subscription_status = $2 WHERE user_id = $3 RETURNING *`,
      [expiryDate, "active", user?.user_id],
    );
    res.json({
      message: "Subscription Purchased Successfully",
      updatedUser,
    });
  } else {
    return res.status(400).json({
      message: "Payment Failed",
    });
  }
};
