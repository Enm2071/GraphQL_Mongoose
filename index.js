const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const mongoose = require('mongoose');
const schema = require('./schema/schema');
const auth = require('./utils/auth');
if (process.env.NODE_ENV !== 'production') require('dotenv').config();

const app = express();

app.use(
    auth.checkHeaders
)

mongoose.connect('mongodb://localhost/graphql-db',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true
    }
).then(() => console.log('DB connected'))
    .catch(err => console.log(err));

app.use('/graphql', graphqlHTTP((req) => ({
    schema,
    context: {
        user: req.user
    }
})));

app.listen(process.env.PORT, () => {
    console.log('listening on 3131');
})