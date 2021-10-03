const PImage = require('pureimage');

const WIDTH = 400;
const HEIGHT = 400;
const maxRad = HEIGHT/3;
const wholeCircle = Math.PI*2;
const centerx = WIDTH>>1;
const centery = HEIGHT>>1;

function addDataIntoImage(img,dataArray,fillStyle){
    var ctx = img.getContext('2d');
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    dataArray.reduce((prev,current)=>{
        let px = centerx + Math.cos(current.time*wholeCircle)*current.value*maxRad;
        let py = centery + Math.sin(current.time*wholeCircle)*current.value*maxRad;
        if(prev){
             ctx.lineTo(px,py)
        }else{
            ctx.moveTo(px,py)
        }
        return {px,py};
    },false);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
}

async function writeImageDataToStream(img,stream){
    await PImage.encodePNGToStream(img, stream);
}

function generateBaseImage(dataArray, secondArray) {
    return PImage.make(WIDTH, HEIGHT);
}


module.exports = {
    generateBaseImage,
    addDataIntoImage,
    writeImageDataToStream
}