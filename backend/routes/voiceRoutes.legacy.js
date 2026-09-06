import { Router } from "express";
import exotelRouter from "./exotelRoutes.js";

const router = Router();

// Route all voice interactions cleanly to Exotel engine
router.use("/", exotelRouter);

export default router;
