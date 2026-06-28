const Jimp = require('jimp');

async function removeWhiteBg(inputPath, outputPath) {
    try {
        const image = await Jimp.read(inputPath);
        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            // Get the RGBA values
            const red = this.bitmap.data[idx + 0];
            const green = this.bitmap.data[idx + 1];
            const blue = this.bitmap.data[idx + 2];
            const alpha = this.bitmap.data[idx + 3];

            // If it's close to white, make it transparent
            if (red > 240 && green > 240 && blue > 240) {
                this.bitmap.data[idx + 3] = 0; // Set alpha to 0
            }
        });
        await image.writeAsync(outputPath);
        console.log(`Saved ${outputPath}`);
    } catch (err) {
        console.error(err);
    }
}

async function run() {
    await removeWhiteBg(
        "C:\\Users\\Lenov\\.gemini\\antigravity-ide\\brain\\718d4081-761b-4e0c-b20f-3d097f6a21f7\\media__1782648196261.png",
        "d:\\React Website\\metro-app\\frontend\\src\\assets\\images\\wonders.png"
    );
    await removeWhiteBg(
        "d:\\React Website\\metro-app\\frontend\\src\\assets\\images\\app_logo.png",
        "d:\\React Website\\metro-app\\frontend\\src\\assets\\images\\app_logo.png"
    );
}

run();
