import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import authRouter from './routes/auth';
import roomsRouter from './routes/rooms';
import locationsRouter from './routes/locations';
import productsRouter from './routes/products';
import instancesRouter from './routes/instances';
import productGroupsRouter from './routes/product-groups';
import tagsRouter from './routes/tags';
import lendingsRouter from './routes/lendings';
import containerTypesRouter from './routes/containerTypes';
import unitsRouter from './routes/units';
import usersRouter from './routes/users';
import adminRouter from './routes/admin';
import settingsRouter from './routes/settings';
import { errorHandler } from './middleware/errorHandler';
import openapiSpec from './openapi';

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));
app.get('/api/docs.json', (_req, res) => res.json(openapiSpec));

app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/products', productsRouter);
app.use('/api/instances', instancesRouter);
app.use('/api/product-groups', productGroupsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/container-types', containerTypesRouter);
app.use('/api/units', unitsRouter);
app.use('/api/lendings', lendingsRouter);
app.use('/api/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/settings', settingsRouter);
// Mount lending sub-routes under /api for /api/instances/:id/lend etc.
app.use('/api', lendingsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Backend läuft auf Port ${PORT}`);
});
