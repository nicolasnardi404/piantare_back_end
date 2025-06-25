import express from "express";
import cors from "cors";
import plantRoutes from "./routes/plantRoutes.js";
import plantLocationRoutes from "./routes/plantLocationRoutes.js";
import plantUpdateRoutes from "./routes/plantUpdateRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import companyRoutes from "./routes/companyRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import geoGptRoutes from "./routes/geoGptRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import authRoutes from "./routes/authRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/plants", plantRoutes);
app.use("/api/plant-locations", plantLocationRoutes);
app.use("/api/plant-updates", plantUpdateRoutes);
app.use("/api/users", userRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/geogpt", geoGptRoutes);
app.use("/api/projects", projectRoutes);

export default app;
