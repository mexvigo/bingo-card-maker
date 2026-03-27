const express = require('express');
const path = require('path');

const app = express();
const PORT = 3008;

app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Bingo Card Maker running at http://localhost:${PORT}`);
});
