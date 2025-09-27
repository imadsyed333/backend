import express from 'express';
import productRoutes from './productRoutes'
import userRoutes from './userRoutes'

const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors')

app.use(express.json())
app.use(cors())

app.use('/products', productRoutes)

app.use('/users', userRoutes)

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});