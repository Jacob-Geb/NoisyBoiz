
let size = 256;
let scale = 4;//25
let octaves = 3;
let perst = 0.4; // 0-1 range
let lacu = 2; // greater than 1
let offset = {x:0, y: 0};
let octaveOffsets = [];

let noise;//[][];
let simplex;
let [minNoise, maxNoise] = [99999999999, -99999999999];
const clamp = (a, min = 0, max = 1) => Math.min(max, Math.max(min, a));
const lerp = (start, end, amt) => (1-amt)*start+amt*end;
const invlerp = (x, y, a) => clamp((a - x) / (y - x));
const smoothstep = (min, max, value) => {
    var x = Math.max(0, Math.min(1, (value-min)/(max-min)));
    return x*x*(3 - 2*x);
};

var init = () => {

    makArr();
    setCanvasSizes();
    wireUpBtns();
    newSeed();

    build();
}

var build = () => {
    makeNoise();
    normalizeNoise();
    drawTex();
}

var newSeed = () => {
    simplex = makeNoise4D(Date.now()); // Using current date as seed

    octaveOffsets = [];
    for (let i = 0; i < 8; i++) {
        octaveOffsets[i] = {
            x: rand(10000) + offset.x,
            y: rand(10000) + offset.y};
    }

}

var makArr = () => {
    noise = [];
    for (let i = 0; i < size; i++) {
        noise[i] = [];
    }
}

var rand = (max) => {
    return (Math.random() * (max * 2)) - max;
}

var makeNoise = () => {

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {

            var amp = 1;
            var freq = 1;
            var noiseVal = 0;

            for (let i = 0; i < octaves; i++) {

                // let sampleX = (x - size/2)/100 * freq + octaveOffsets[i].x;
                // let sampleY = (y - size/2)/100 * freq + octaveOffsets[i].y;
                // const value = (simplex(sampleX, sampleY, 0.5, 0.5));

                const pi = Math.PI;
                const cos = Math.cos;
                const sin = Math.sin;

                var s = (x/size) * freq + octaveOffsets[i].x;
                var t = (y/size) * freq + octaveOffsets[i].y;

                var x1 = -scale;
                var y1 = -scale;
                var x2 = scale;
                var y2 = scale;
                
                // or x1=0,y1=0,x2=1,y2=1

                var dx = x2 - x1;
                var dy = y2 - y1;

                var nx = x1 + cos(s*2*pi)*dx/(2*pi);
                var ny = y1 + cos(t*2*pi)*dy/(2*pi);
                var nz = x1 + sin(s*2*pi)*dx/(2*pi);
                var nw = y1 + sin(t*2*pi)*dy/(2*pi);

                const value = simplex(nx,ny,nz,nw);

                noiseVal += value * amp;

                amp *= perst;
                freq *= lacu;
            }

            noise[x][y] = noiseVal;
            minNoise = Math.min(minNoise, noiseVal);
            maxNoise = Math.max(maxNoise, noiseVal);
        }
    }
};

var normalizeNoise = () => {

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            noise[x][y] = invlerp(minNoise, maxNoise, noise[x][y]);
        }
    }
}

var drawTex = () => {

    let canvi = document.querySelectorAll("canvas");
    canvi.forEach ((canvas, canvasID) => {

        const ctx = canvas.getContext("2d");
        const imageData = ctx.createImageData(size, size);

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
    
                let noiseVal = noise[x][y] * 255;
                setVal(x, y, noiseVal);
            }
        }
        
        function setVal (x,y, value){
    
            let id = (x + (y * size)) * 4;
            imageData.data[id + 0] = value;
            imageData.data[id + 1] = value;
            imageData.data[id + 2] = value;
            imageData.data[id + 3] = getAlpha(x,y);
        }

        function getAlpha (x,y){

            var min = 0.5;
            var max = 1;
            var mult = 230;

            switch (canvasID){
                case 0: return 255;
                case 1: return smoothstep(min, max, (1 - x/size)) *  mult;
                case 2: return smoothstep(min, max, (1 - y/size)) *  mult;
                case 3: return Math.min(smoothstep(min, max, (1 - x/size)), smoothstep(min, max, (1 - y/size))) * mult;
            }
        }
    
        ctx.putImageData(imageData, 0, 0);
    });

    let canvas = document.querySelector("canvas");
    let img = document.getElementById("img");
    img.src = canvas.toDataURL("image/png");
}

var setCanvasSizes = () => {

    let canvi = document.querySelectorAll("canvas");
    canvi.forEach ((canvas, i) => {
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height);
    });
}

var wireUpBtns = () => {

    let makeBtn = document.getElementById("makeBtn");
    makeBtn.addEventListener("click", ()=>{
        newSeed();
        build();
    });

    let scaleSlider = document.getElementById("scaleSlider");
    scaleSlider.value = scale * 10;
    scaleSlider.addEventListener("change", (evt) => {
        scale = scaleSlider.value/10;
        build();
    });

    let octavesSlider = document.getElementById("octavesSlider");
    octavesSlider.value = octaves;
    octavesSlider.addEventListener("change", (evt) => {
        octaves = octavesSlider.value;
        build();
    });

    let sizeSelect = document.getElementById("sizeSelect");
    sizeSelect.value = size;
    sizeSelect.addEventListener("change", (evt) => {
        size = sizeSelect.value;
        makArr();
        setCanvasSizes();
        build();
    });

    let perstSlider = document.getElementById("perstSlider");
    perstSlider.value = perst * 100;
    perstSlider.addEventListener("change", (evt) => {
        perst = perstSlider.value/100;
        build();
    });

    let lacuSlider = document.getElementById("lacuSlider");
    lacuSlider.value = lacu;
    lacuSlider.addEventListener("change", (evt) => {
        lacu = lacuSlider.value;
        build();
    });
}


init();