const DOTS = [];
let particles = 100;
let width = 0;
let height = 0;
let color1 = 360;
let color2 = 90;
let lineWidth = 1;
let dist = 200;
let bounds = undefined;

function normalize(a, b) {
    const norm = Math.hypot(a, b);
    return [a / norm, b / norm];
}

class Dot {
    constructor(canvas, bounds) {
        this.bounds = bounds;
        this.x = Math.random() * (bounds.x + bounds.pad*2) - bounds.pad;
        this.y = Math.random() * (bounds.y + bounds.pad*2) - bounds.pad;
        this.vx = Math.random() - 0.5;
        this.vy = Math.random() - 0.5;

        [this.vx, this.vy] = normalize(this.vx, this.vy);

        this.velocity = 0.3;
    }

    get point() {
        return new QT.Point(this.x, this.y);
    }

    update() {
        this.x += this.vx * this.velocity;
        this.y += this.vy * this.velocity;

        const p = this.bounds.pad;
        const w = this.bounds.x + 2 * p;
        const h = this.bounds.y + 2 * p;

        this.x = (((this.x + p) % w) + w) % w - p;
        this.y = (((this.y + p) % h) + h) % h - p;
    }
}

const wrapper = document.getElementById('wrapper');

const range1 = document.getElementById('color1');
const range1val = document.getElementById('color1-value');

const range2 = document.getElementById('color2');
const range2val = document.getElementById('color2-value');

const range3 = document.getElementById('distance');
const range3val = document.getElementById('distance-value');

const range4 = document.getElementById('width');
const range4val = document.getElementById('width-value');

const range5 = document.getElementById('particles');
const range5val = document.getElementById('particles-value');

const imgWidth = document.getElementById('imgwidth');
const imgHeight = document.getElementById('imgheight');
const save = document.getElementById('save');

const download = document.getElementById("download");

save.addEventListener('click', e => {
    const saveCanvas = document.createElement('canvas');
    saveCanvas.width = +imgWidth.value;
    saveCanvas.height = +imgHeight.value;
    const saveDots = [];

    for (let i = 0; i < particles; i++) {
        saveDots.push(new Dot(saveCanvas, {x: saveCanvas.width, y: saveCanvas.height, pad: dist}));
    }

    draw(saveCanvas, saveDots);
    download.setAttribute('download', imgWidth.value + "_" + imgHeight.value + "_" + Date.now() + ".png");
    download.setAttribute('href', saveCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream"));
    download.click();
});

color1 = +range1.value;
color2 = +range2.value;

range1val.innerText = color1;
range2val.innerText = color2;
range3val.innerText = dist;
range4val.innerText = lineWidth;
range5val.innerText = particles;


range1.addEventListener("input", e => {
    color1 = +e.target.value;
    range1val.innerText = color1;
});

range2.addEventListener("input", e => {
    color2 = +e.target.value;
    range2val.innerText = color2;
});

range3.addEventListener("input", e => {
    dist = +e.target.value;
    canvas.width = width;
    canvas.height = height;
    bounds.x = width;
    bounds.y = height;
    bounds.pad = dist;

    range3val.innerText = dist;
});

range4.addEventListener("input", e => {
    lineWidth = +e.target.value;
    range4val.innerText = lineWidth;
});

range5.addEventListener("input", e => {
    particles = +e.target.value;
    range5val.innerText = particles;
});

const canvas = document.getElementById('canvas');
canvas.width = wrapper.clientWidth;
canvas.height = wrapper.clientHeight;

bounds = {x: canvas.width, y: canvas.height, pad: dist};


const obs = new ResizeObserver(entries => {
    for (let e of entries) {
        width = e.contentRect.width;
        height = e.contentRect.height;
        canvas.width = width;
        canvas.height = height;
        bounds.x = width;
        bounds.y = height;
        bounds.pad = dist;
    }
});
obs.observe(wrapper);

for (let i = 0; i < 1000; i++) {
    DOTS.push(new Dot(canvas, bounds));
}

function draw(canvas, inputDots) {
    const context = canvas.getContext("2d");
    const dots = inputDots.slice(0, particles);
    const bbox = new QT.Box(-dist, -dist, canvas.width + dist, canvas.height + dist);
    const qt = new QT.QuadTree(bbox);

    context.fillStyle = '#000';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for (let dot of dots) {
        dot.update();        
        qt.insert(dot.point);
    }

    context.save();
    context.lineCap = "round";
    context.lineWidth = lineWidth;

    for (let dot of dots) {
        const p1 = dot.point;
        const points = qt.query(new QT.Circle(p1.x, p1.y, dist));
        for (let p2 of points) {
            if (p1.x == p2.x && p1.y == p2.y)
                continue;
            const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
            const hue = (Math.atan2(p1.y - p2.y, p1.x - p2.x) / Math.PI) ** 2 * color1 + color2;
            context.strokeStyle = 'hsla(' + hue + ',100%,50%,' + ((dist - d) / dist) ** 2 + ')';
            context.beginPath();
            context.moveTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.stroke();
        }
    }
    context.restore();
}

function loop() {
    draw(canvas, DOTS);
    requestAnimationFrame(loop);
}

loop();
