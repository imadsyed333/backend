import express from 'express';
import productRoutes from './routes/product-routes'
import userRoutes from './routes/user-routes'
import orderRoutes from './routes/order-routes'

const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))

app.use('/products', productRoutes)

app.use('/user', userRoutes)

app.use('/orders', orderRoutes)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});