import express from "express";
const router = express.Router();
import { houseDB, notificationDB, userDB } from "../configs/mongo.js";
import { ObjectId } from "mongodb";
import { io } from "../index.js";
import logger from "../configs/logger.js";
import { verifyToken } from "../apis/jwt.js";

router.post("/receive", verifyToken, async (req, res) => {
  const dateToday = new Date();
  const { mid } = req.user;

  try {
    const readNotifications = [];

    const notifications = await notificationDB
      .find({ expiry: { $gte: dateToday }, scope: "all" })
      .toArray();

    const user = await userDB.findOne({ mid });
    const houseNotification = await notificationDB
      .find({ expiry: { $gte: dateToday }, scope: user.house.id })
      .toArray();

    const notificationsArr = [...notifications, ...houseNotification];
    console.log(notificationsArr);

    res.send({ status: "success", notifications: notificationsArr });
  } catch (err) {
    console.log(err);
    logger.error({
      code: "NOT-NTH-100",
      message: "Failed to receive notifications",
      err: err.message,
      mid: req.user.mid,
    });
    res.status(500).send({ status: "error", message: err.message });
  }
});

router.post("/clear", verifyToken, async (req, res) => {
  const notificationIDs = req.body.notificationIDs;

  try {
    const result = await userDB.updateOne(
      { mid: req.user.mid },
      { $addToSet: { readNotifications: { $each: notificationIDs } } }
    );

    res.send({ status: "success" });
  } catch (err) {
    logger.error({
      code: "NOT-NTH-101",
      message: "Failed to clear notifications",
      err: err.message,
      mid: req.user.mid,
    });
    res.status(500).send({ status: "error", message: err.message });
  }
});

export default router;
