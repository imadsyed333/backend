import express from 'express';
import productRoutes from './routes/product-routes'
import userRoutes from './routes/user-routes'
import orderRoutes from './routes/order-routes'
import cartRoutes from './routes/cart-routes'

require('dotenv').config()
const app = express();
const port = process.env.PORT!
const client_url = process.env.CLIENT_URL!
const cors = require('cors')
const cookieParser = require('cookie-parser')

app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: client_url,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}))

app.use('/products', productRoutes)

app.use('/user', userRoutes)

app.use('/orders', orderRoutes)

app.use('/cart', cartRoutes)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});