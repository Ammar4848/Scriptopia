import express from "express";
import { eventsDB } from "../configs/mongo.js";
import { ObjectId } from "mongodb";
import logger from "../configs/logger.js";
import { verifyPerms } from "./verifyPermissions.js";
import { verifyToken } from "../apis/jwt.js";
const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const events = await eventsDB.find().toArray();
    res.status(200).json(events);
  } catch (err) {
    logger.error({
      code: "ADM-EVH-101",
      message: "Failed to fetch events for " + req.user.mid,
      err: err.message,
      mid: req.user.mid,
    });
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const event = await eventsDB.findOne({ _id: new ObjectId(id) });
    if (event) {
      res.status(200).json(event);
    } else {
      res.status(404).json({ message: "Event not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error in getting event" });
    logger.error({
      code: "EVH100",
      message: "Error in getting event",
      err: error,
    });
  }
});

router.post(
  "/:id/update",
  verifyToken,
  verifyPerms("MHI"),
  async (req, res) => {
    const id = req.params.id;
    const {
      name,
      image,
      desc,
      location,
      mode,
      link,
      email,
      phone,
      eventStarts,
      eventEnds,
      registerationStarts,
      registeratinEnds,
    } = req.body;

    try {
      await eventsDB.updateOne(
        { _id: new ObjectId(id) },
        {
          $set: {
            name: name.toString(),
            image: image.toString(),
            desc: desc.toString(),
            location: location.toString(),
            mode: mode.toString(),
            link: link.toString(),
            email: email.toString(),
            phone: phone.toString(),
            eventStarts: new Date(eventStarts),
            eventEnds: new Date(eventEnds),
            registerationStarts: new Date(registerationStarts),
            registeratinEnds: new Date(registeratinEnds),
          },
        }
      );

      res.status(200).json({ status: "success" });
    } catch (error) {
      res.status(500).json({ message: "Error in updating event" });
      logger.error({
        code: "EVH101",
        message: "Error in updating event",
        err: error,
      });
    }
  }
);

router.post(
  "/:id/delete",
  verifyToken,
  verifyPerms("MHI"),
  async (req, res) => {
    const id = req.params.id;

    try {
      await eventsDB.deleteOne({ _id: new ObjectId(id) });
      res.status(200).json({ status: "success" });
    } catch (error) {
      res.status(500).json({ message: "Error in deleting event" });
      logger.error({
        code: "EVH102",
        message: "Error in deleting event",
        err: error,
      });
    }
  }
);

router.post("/create", verifyToken, verifyPerms("MHI"), async (req, res) => {
  const {
    name,
    image,
    desc,
    location,
    mode,
    link,
    email,
    phone,
    eventStarts,
    eventEnds,
    registerationStarts,
    registerationEnds,
    registerationMode,
  } = req.body;

  try {
    const eventDocument = {
      name: name.toString(),
      image: image.toString(),
      desc: desc.toString(),
      location: location.toString(),
      mode: mode.toString(),
      link: link.toString(),
      email: email.toString(),
      phone: phone.toString(),
      eventStarts: new Date(eventStarts),
      eventEnds: new Date(eventEnds),
      registerationStarts: new Date(registerationStarts),
      registerationEnds: new Date(registerationEnds),
      createdAt: new Date(),
      registerationType: registerationMode.toString(),
    };

    if (registerationMode === "internal") {
      eventDocument.registered = [];
    }

    await eventsDB.insertOne(eventDocument);
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Error in Creating event" });
    logger.error({
      code: "EVH101",
      message: "Error in Creating event",
      err: error,
    });
  }
});

router.post("/:id/register", verifyToken, async (req, res) => {
  const id = req.params.id;
  const mid = req.user.mid;

  try {
    await eventsDB.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { registered: mid } }
    );
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Error in registering for event" });
    logger.error({
      code: "EVH103",
      message: "Error in registering for event",
      err: error,
    });
  }
});

router.post("/:id/deregister", verifyToken, async (req, res) => {
  const id = req.params.id;
  const mid = req.user.mid;

  try {
    await eventsDB.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { registered: mid } }
    );
    res.status(200).json({ status: "success" });
  } catch (error) {
    res.status(500).json({ message: "Error in registering for event" });
    logger.error({
      code: "EVH104",
      message: "Error in registering for event",
      err: error,
    });
  }
});

export default router;