class Line {
  constructor(engine) {
    this.engine = engine;
    this.ctx = ctx;
    this.points = [];
  }

  isIntersecting(other, mouse) {
    const point = {};
    const x1 = this.points[0].x;
    const y1 = this.points[0].y;
    let x2 = 0;
    let y2 = 0;
    if (this.points[1]) {
      x2 = this.points[1].x;
      y2 = this.points[1].y;
    } else {
      x2 = mouse.x;
      y2 = mouse.y;
    }
    const x3 = other.points[0].x;
    const y3 = other.points[0].y;
    const x4 = other.points[1].x;
    const y4 = other.points[1].y;
    const uA =
      ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) /
      ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));
    const uB =
      ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) /
      ((y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1));

    if (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1) {
      point.x = x1 + uA * (x2 - x1);
      point.y = y1 + uA * (y2 - y1);

      return point;
    }
    return point;
  }

  draw() {
    const mouse = this.engine.mouse;
    switch (this.points.length) {
      case 1:
        ctx.beginPath();
        ctx.stroke();
        ctx.closePath();

        if (mouse) {
          ctx.strokeStyle = "Black";
          ctx.beginPath();
          ctx.moveTo(this.points[0].x, this.points[0].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
          ctx.closePath();
          if (engine.entities.length > 1) {
            for (
              let i = 0;
              i < this.engine.entities.length &&
              this.engine.entities[i] !== this;
              i++
            ) {
              const ent = this.engine.entities[i];
              if (ent instanceof Line) {
                const intPoint = this.isIntersecting(ent, mouse);
                ctx.beginPath();
                ctx.strokeStyle = "Red";
                ctx.arc(intPoint.x, intPoint.y, 4, 0, 2 * Math.PI);
                ctx.stroke();
                ctx.strokeStyle = "Black";
                ctx.closePath();
              }
            }
          }
        }
        break;
      case 2:
        for (
          let i = 0;
          i < this.engine.entities.length && this.engine.entities[i] !== this;
          i++
        ) {
          const ent = this.engine.entities[i];
          if (ent instanceof Line) {
            const intPoint = this.isIntersecting(ent, mouse);
            ctx.beginPath();
            ctx.strokeStyle = "Red";
            ctx.arc(intPoint.x, intPoint.y, 4, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.strokeStyle = "Black";
            ctx.closePath();
          }
        }
        ctx.beginPath();
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.lineTo(this.points[1].x, this.points[1].y);
        ctx.stroke();
        ctx.closePath();

        break;
    }
  }

  undoPoints() {
    this.points = [];
  }

  reduceEqually() {
    const p1 = this.points[0];
    const p2 = this.points[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const mag = Math.hypot(dx, dy);
    const r2 = mag / 60;
    if (mag < 2) {
      this.undoPoints();
      this.removeFromWorld = true;
      return;
    }
    return [
      {
        x: p1.x + (r2 * dx) / mag,
        y: p1.y + (r2 * dy) / mag,
      },
      {
        x: p2.x - (r2 * dx) / mag,
        y: p2.y - (r2 * dy) / mag,
      },
    ];
  }

  update() {
    if (!engine.collapse) {
      if (this.engine.rightClick && this.points.length === 1) {
        this.undoPoints();
        this.engine.rightClick = null;
      }
      if (this.engine.click && this.points.length < 2) {
        if (
          this.points.length === 0 ||
          this.engine.click.x > this.points[0].x
        ) {
          this.points.push(this.engine.click);
        } else this.points.splice(0, 0, this.engine.click);

        if (this.points.length === 2) {
          this.engine.addEntity(new Line(this.engine));
        }
        this.engine.click = null;
      }
    }
  }
}

class Engine {
  constructor(ctx) {
    this.entities = [];
    this.ctx = ctx;
    this.surfaceWidth = null;
    this.surfaceHeight = null;
    this.click = null;
    this.rightClick = false;
    this.collapse = false;
  }

  init() {
    this.surfaceWidth = this.ctx.canvas.width;
    this.surfaceHeight = this.ctx.canvas.height;
    this.startInput();
    this.timer = new Timer();
  }

  start() {
    const gameLoop = () => {
      this.loop();
      window.requestAnimationFrame(gameLoop, this.ctx.canvas);
    };
    gameLoop();
  }

  startInput() {
    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };

    this.ctx.canvas.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.rightClick = true;
    });

    this.ctx.canvas.addEventListener("click", (e) => {
      this.click = getMousePos(e);
    });

    this.ctx.canvas.addEventListener("mousemove", (e) => {
      this.mouse = getMousePos(e);
    });
  }

  addEntity(entity) {
    this.entities.push(entity);
  }

  draw() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    for (let i = 0; i < this.entities.length; i++) {
      this.entities[i].draw(this.ctx);
    }
  }

  update() {
    const entitiesCount = this.entities.length;

    if (this.collapse) {
      if (this.entities.length === 1) {
        this.collapse = false;
        return;
      }
      this.entities.forEach((element) => {
        if (element.points.length > 0) element.points = element.reduceEqually();
      });
    }

    for (let i = 0; i < entitiesCount; i++) {
      const entity = this.entities[i];

      if (!entity.removeFromWorld) {
        entity.update();
      }
    }

    for (let i = this.entities.length - 1; i >= 0; --i) {
      if (this.entities[i].removeFromWorld) {
        this.entities.splice(i, 1);
      }
    }
  }

  loop() {
    this.clockTick = this.timer.tick();
    this.update();
    this.draw();
    this.click = null;
    this.rightClick = false;
  }
}

class Timer {
  constructor() {
    this.gameTime = 0;
    this.maxStep = 0.05;
    this.lastTimestamp = 0;
  }

  tick() {
    const current = Date.now();
    const delta = (current - this.lastTimestamp) / 1000;
    this.lastTimestamp = current;

    const gameDelta = Math.min(delta, this.maxStep);
    this.gameTime += gameDelta;
    return gameDelta;
  }
}

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const btn = document.querySelector("button");
btn.addEventListener("click", () => {
  engine.collapse = true;
});

const engine = new Engine(ctx);
engine.init();

const line = new Line(engine);

engine.addEntity(line);

engine.start();
