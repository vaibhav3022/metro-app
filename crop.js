const Jimp = require('jimp');

async function crop() {
    try {
        const image = await Jimp.read("d:\\React Website\\metro-app\\frontend\\src\\assets\\images\\wonders.png");
        image.autocrop();
        await image.writeAsync("d:\\React Website\\metro-app\\frontend\\src\\assets\\images\\wonders.png");
        console.log("Cropped successfully");
    } catch (err) {
        console.error(err);
    }
}
crop();
