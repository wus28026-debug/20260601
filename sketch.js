let monsters = [];
let explosionParticles = [];
let missiles = []; // 新增飛彈陣列
let powerUps = []; // 新增道具陣列
let colors = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff', '#fffffc'];
let lastSpawnTime = 0;
let score = 0; // 新增計分變數
let shakeAmount = 0; // 震動強度
let gameDuration = 60; // 遊戲總時長 (秒)
let startTime;
let gameState = "START"; // 遊戲狀態：START, PLAYING, GAMEOVER
let startButton;

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // 建立開始按鈕
  startButton = createButton('開始遊戲');
  styleButton();
  startButton.mousePressed(startGame);
}

function styleButton() {
  startButton.position(width / 2 - 50, height / 2);
  startButton.size(100, 40);
  startButton.style('background-color', '#ffc6ff');
  startButton.style('border', 'none');
  startButton.style('border-radius', '10px');
  startButton.style('cursor', 'pointer');
  startButton.style('font-weight', 'bold');
}

function startGame() {
  gameState = "PLAYING";
  score = 0;
  monsters = [];
  missiles = [];
  explosionParticles = [];
  powerUps = [];
  startTime = millis();
  lastSpawnTime = millis();
  startButton.hide();
  
  // 初始產生更多物件 (從 20 增加到 30)
  for (let i = 0; i < 30; i++) {
    spawnMonster();
  }
}

function draw() {
  // 當分數達到 50 分時，啟動彩虹背景效果
  if (score >= 50) {
    drawRainbowBackground();
  } else {
    background(0); // 全螢幕背景黑色
  }

  if (gameState === "START") {
    drawMenu();
    return;
  }

  if (gameState === "GAMEOVER") {
    drawGameOver();
    return;
  }

  // 螢幕搖晃邏輯：使用 push/pop 包裹所有要震動的內容
  push();
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.85; // 震動衰減係數，數字越小衰減越快
  }

  // 隨著時間產生的物件越多 (間隔從 5秒 縮短至 0.8秒)
  let elapsed = (millis() - startTime) / 1000;
  
  // 檢查勝負條件：分數達標即成功，時間結束未達標則失敗
  if (score >= 100 || elapsed >= gameDuration) {
    gameState = "GAMEOVER";
    return;
  }

  // 縮短產生間隔，讓怪物更多 (從 3秒 到 0.4秒 產生一個)
  // 進一步縮短產生間隔，讓怪物數量更多 (從 0.4秒 縮短至 0.2秒)
  let spawnInterval = map(min(elapsed, gameDuration), 0, gameDuration, 3000, 200);
  if (millis() - lastSpawnTime > spawnInterval) {
    spawnMonster();
    lastSpawnTime = millis();
  }

  // 更新所有物件與檢查碰撞
  for (let i = 0; i < monsters.length; i++) {
    monsters[i].update();
    // 檢查與其他物件的碰撞
    for (let j = i + 1; j < monsters.length; j++) {
      monsters[i].checkCollision(monsters[j]);
    }
    monsters[i].display();
  }

  // 更新與顯示飛彈，並檢查飛彈與物件的碰撞
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].update();
    missiles[i].display();

    // 如果飛彈超出畫面，則移除
    if (!missiles[i].active) {
      missiles.splice(i, 1);
      continue; // 跳過此飛彈，檢查下一個
    }

    // 檢查飛彈與怪物的碰撞
    for (let j = monsters.length - 1; j >= 0; j--) {
      let m = monsters[j];
      if (missiles[i].checkCollision(m)) {
        m.explode(); // 怪物爆炸
        monsters.splice(j, 1); // 移除怪物
        missiles[i].active = false; // 飛彈失效
        // 分數邏輯：擊中心型 +10，擊中惡魔 -5，其他 +5
        if (m.shapeType === 'HEART') {
          score += 10;
        } else if (m.shapeType === 'DEMON') {
          score -= 5;
        } else {
          score += 5;
        }

        // 15% 機率掉落增加時間的道具
        if (random() < 0.15) {
          powerUps.push(new PowerUp(m.pos.x, m.pos.y));
        }
        break; // 飛彈只會擊中一個怪物，所以檢查完畢後跳出內層迴圈
      }
    }

    // 檢查飛彈與道具的碰撞
    for (let j = powerUps.length - 1; j >= 0; j--) {
      if (missiles[i].active && powerUps[j].checkCollision(missiles[i])) {
        gameDuration += 5; // 增加 5 秒遊戲時間
        powerUps.splice(j, 1);
        missiles[i].active = false;
        break;
      }
    }
  }

  // 更新與顯示道具，並移除超出畫面的道具
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].update();
    powerUps[i].display();
    if (!powerUps[i].active) {
      powerUps.splice(i, 1);
    }
  }

  // 更新與顯示爆炸粒子，並移除消失的粒子
  for (let i = explosionParticles.length - 1; i >= 0; i--) {
    explosionParticles[i].update();
    explosionParticles[i].display();
    if (explosionParticles[i].isDead()) {
      explosionParticles.splice(i, 1);
    }
  }

  drawPointer(); // 呼叫繪製中央箭頭與分數的函式
  pop(); // 結束震動範圍
}

function drawMenu() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(50);
  text("粒子射擊遊戲", width / 2, height / 2 - 80);
  textSize(20);
  text("目標 100 分挑戰！擊中心型 +10，擊中惡魔 -5。左鍵發射，右鍵產生怪物", width / 2, height / 2 - 30);
}

function drawGameOver() {
  textAlign(CENTER, CENTER);

  let isWin = score >= 100;
  let resultText = isWin ? "挑戰成功" : "挑戰失敗";
  let resultColor = isWin ? '#9bf6ff' : '#ffadad'; // 成功用粉藍，失敗用粉紅

  textSize(60);
  fill(resultColor);
  text(resultText, width / 2, height / 2 - 100);
  textSize(30);
  fill(255);
  text(`最終分數: ${score}`, width / 2, height / 2 - 40);
  startButton.html('重新開始');
  startButton.show();
}

// 畫布中間的指標與分數顯示
function drawPointer() {
  push();
  translate(width / 2, height / 2); // 將原點移到畫布中央
  let angle = atan2(mouseY - height / 2, mouseX - width / 2); // 計算滑鼠與中央的夾角
  rotate(angle); // 旋轉畫布

  fill(255, 200, 0); // 指標顏色 (黃色)
  noStroke();
  rect(-20, -5, 30, 10); // 箭頭身
  triangle(10, -15, 10, 15, 40, 0); // 箭頭頭
  pop();

  fill(255); // 分數文字顏色
  textSize(24);
  textAlign(LEFT, TOP);
  text(`Score: ${score}`, 10, 10); // 顯示分數

  // 顯示倒數計時器
  let elapsed = (millis() - startTime) / 1000;
  let timeLeft = ceil(max(0, gameDuration - elapsed));
  textAlign(CENTER, TOP);
  textSize(32);
  fill(255, 100, 100); // 倒數計時使用淡紅色
  text(`Time Left: ${timeLeft}s`, width / 2, 20);
}

// 繪製動態彩虹漸變背景
function drawRainbowBackground() {
  push();
  colorMode(HSB, 360, 100, 100);
  noFill();
  for (let y = 0; y < height; y += 10) {
    // 根據 y 座標與 frameCount 產生色彩偏移
    let h = (y / height * 360 + frameCount * 2) % 360;
    stroke(h, 50, 20); // 較低的飽和度(50)與亮度(20)確保背景不會太刺眼
    strokeWeight(10);
    line(0, y, width, y);
  }
  pop();
  colorMode(RGB, 255); // 重設色彩模式，以免影響其他繪圖邏輯
}

function spawnMonster(spawnX, spawnY) {
  // 隨著時間越到後面，產生的例子縮小幅度減小 (比例從 1.0 調整為最小 0.6)
  let elapsed = (millis() - startTime) / 1000;
  let sizeScale = map(min(elapsed, gameDuration), 0, gameDuration, 1.0, 0.6);
  let size = random(40, 100) * sizeScale;

  // 如果有傳入座標則使用該座標，否則隨機產生
  let x = spawnX !== undefined ? spawnX : random(size, width - size);
  let y = spawnY !== undefined ? spawnY : random(size, height - size);
  let col = random(colors);
  monsters.push(new Monster(x, y, size, col));

  // 如果是由滑鼠產生（即有傳入座標），則加入爆炸效果
  if (spawnX !== undefined && spawnY !== undefined) {
    shakeAmount = 5; // 滑鼠產生時給予輕微震動
    for (let i = 0; i < 40; i++) { // 增加點擊時的粒子數
      explosionParticles.push(new ExplosionParticle(x, y, col));
    }
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  startButton.position(width / 2 - 50, height / 2);
}

function mousePressed() {
  if (gameState !== "PLAYING") return;

  if (mouseButton === LEFT) { // 如果是滑鼠左鍵
    let pointerAngle = atan2(mouseY - height / 2, mouseX - width / 2); // 取得指標方向
    missiles.push(new Missile(width / 2, height / 2, pointerAngle)); // 從中心發射飛彈
  } else {
    spawnMonster(mouseX, mouseY); // 原有的右鍵或非左鍵產生怪物功能
  }
}

class Monster {
  constructor(x, y, s, c) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(0.5, 2));
    this.size = s;
    this.color = c;
    // 隨機分配形狀類型
    this.shapeType = random(['HEART', 'TEARDROP', 'TRAPEZOID', 'STAR', 'CIRCLE', 'SQUARE', 'DEMON']); // 減少惡魔出現的機率
  }

  update() {
    this.pos.add(this.vel);
    // 碰到邊界反彈
    if (this.pos.x < this.size / 2 || this.pos.x > width - this.size / 2) this.vel.x *= -1;
    if (this.pos.y < this.size / 2 || this.pos.y > height - this.size / 2) this.vel.y *= -1;
  }

  checkCollision(other) {
    let d = dist(this.pos.x, this.pos.y, other.pos.x, other.pos.y);
    let minDist = (this.size + other.size) / 2;
    
    if (d < minDist) {
      // 1. 分離物件，防止重疊卡住（靜態碰撞排除）
      let angle = atan2(other.pos.y - this.pos.y, other.pos.x - this.pos.x);
      let overlap = minDist - d;
      let moveX = cos(angle) * overlap / 2;
      let moveY = sin(angle) * overlap / 2;
      this.pos.x -= moveX;
      this.pos.y -= moveY;
      other.pos.x += moveX;
      other.pos.y += moveY;

      // 2. 速度反彈（交換速度向量）
      let tempVel = this.vel.copy();
      this.vel = other.vel.copy();
      other.vel = tempVel;
    }
  }

  // 怪物爆炸效果
  explode() {
    shakeAmount = 15; // 飛彈擊中時給予強烈震動
    for (let i = 0; i < 120; i++) { // 增加粒子數量至 120，讓爆炸更華麗
      explosionParticles.push(new ExplosionParticle(this.pos.x, this.pos.y, this.color));
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    
    let elapsed = (millis() - startTime) / 1000;
    let isUrgent = (gameDuration - elapsed <= 10);

    let d = dist(mouseX, mouseY, this.pos.x, this.pos.y);
    // 最後 10 秒進入緊急狀態，怪物閃爍白色，頻率放慢
    if (isUrgent && floor(frameCount / 10) % 2 === 0) {
      fill(255);
    } else {
      fill(this.color);
    }
    noStroke();

    // 判斷滑鼠靠近則變為圓形，否則為星狀圓弧
    if (d < this.size * 1.5) {
      ellipse(0, 0, this.size);
    } else {
      this.drawBaseShape();
    }

    // 繪製眼睛
    let eyeOffset = this.size * 0.2;
    let eyeSize = this.size * 0.25;
    this.drawEye(-eyeOffset, -eyeOffset / 2, eyeSize);
    this.drawEye(eyeOffset, -eyeOffset / 2, eyeSize);

    // 繪製表情 (嘴巴與眉毛)
    noFill();
    stroke(0);
    strokeWeight(this.size * 0.03); 
    
    if (isUrgent || this.shapeType === 'DEMON') {
      // 邪惡的倒弧嘴巴 (惡魔固定使用顛倒嘴巴)
      arc(0, this.size * 0.2, this.size * 0.4, this.size * 0.2, PI, TWO_PI);
      
      // 邪惡的斜角眉毛
      let browW = this.size * 0.15;
      let browH = this.size * 0.1;
      // 左眉
      line(-eyeOffset - browW, -eyeOffset - browH, -eyeOffset + browW * 0.5, -eyeOffset);
      // 右眉
      line(eyeOffset + browW, -eyeOffset - browH, eyeOffset - browW * 0.5, -eyeOffset);
    } else {
      // 正常的笑嘴
      arc(0, this.size * 0.1, this.size * 0.4, this.size * 0.3, 0, PI);
    }
    
    pop();
  }

  // 根據隨機類型繪製基礎形狀
  drawBaseShape() {
    switch (this.shapeType) {
      case 'HEART':
        beginShape();
        for (let a = 0; a < TWO_PI; a += 0.1) {
          let r = this.size / 40;
          let tx = 16 * pow(sin(a), 3);
          let ty = -(13 * cos(a) - 5 * cos(2 * a) - 2 * cos(3 * a) - cos(4 * a));
          vertex(tx * r, ty * r);
        }
        endShape(CLOSE);
        break;
      case 'TEARDROP':
        beginShape();
        vertex(0, -this.size * 0.5);
        bezierVertex(this.size * 0.4, -this.size * 0.2, this.size * 0.4, this.size * 0.4, 0, this.size * 0.4);
        bezierVertex(-this.size * 0.4, this.size * 0.4, -this.size * 0.4, -this.size * 0.2, 0, -this.size * 0.5);
        endShape(CLOSE);
        break;
      case 'TRAPEZOID':
        let w = this.size * 0.8;
        let h = this.size * 0.6;
        beginShape();
        vertex(-w * 0.25, -h * 0.5);
        vertex(w * 0.25, -h * 0.5);
        vertex(w * 0.5, h * 0.5);
        vertex(-w * 0.5, h * 0.5);
        endShape(CLOSE);
        break;
      case 'STAR':
        this.drawStarBody(0, 0, this.size * 0.4, this.size * 0.6, 12);
        break;
      case 'CIRCLE':
        ellipse(0, 0, this.size);
        break;
      case 'SQUARE':
        rectMode(CENTER);
        rect(0, 0, this.size * 0.8, this.size * 0.8);
        break;
      case 'DEMON':
        ellipse(0, 0, this.size * 0.8);
        // 繪製惡魔角
        beginShape();
        vertex(-this.size * 0.35, -this.size * 0.1);
        vertex(-this.size * 0.2, -this.size * 0.5);
        vertex(-this.size * 0.05, -this.size * 0.2);
        endShape(CLOSE);
        beginShape();
        vertex(this.size * 0.35, -this.size * 0.1);
        vertex(this.size * 0.2, -this.size * 0.5);
        vertex(this.size * 0.05, -this.size * 0.2);
        endShape(CLOSE);
        break;
    }
  }

  drawStarBody(x, y, radius1, radius2, npoints) {
    let angle = TWO_PI / npoints;
    let halfAngle = angle / 2.0;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = x + cos(a) * radius2;
      let sy = y + sin(a) * radius2;
      vertex(sx, sy);
      sx = x + cos(a + halfAngle) * radius1;
      sy = y + sin(a + halfAngle) * radius1;
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  drawEye(x, y, size) {
    fill(255); // 白色眼球
    noStroke();
    ellipse(x, y, size);
    
    // 黑眼珠跟隨滑鼠
    let angle = atan2(mouseY - (this.pos.y + y), mouseX - (this.pos.x + x));
    let pupilDist = size * 0.2;
    let px = x + cos(angle) * pupilDist;
    let py = y + sin(angle) * pupilDist;
    fill(0);
    ellipse(px, py, size * 0.5);
  }
}

class ExplosionParticle {
  constructor(x, y, col) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D().mult(random(3, 12)); // 提高初始噴發速度範圍
    this.lifespan = 255; // 初始透明度

    // 讓顏色更有層次感：一半使用怪物原色，另一半混入亮色模擬火花
    let baseCol = color(col);
    if (random() > 0.5) {
      this.color = col;
    } else {
      this.color = lerpColor(baseCol, color(255, 255, 200), random(0.5, 1));
    }
    this.size = random(5, 15); // 隨機初始大小
  }

  update() {
    this.vel.mult(0.92); // 加入空氣阻力，讓粒子逐漸減速
    this.pos.add(this.vel);
    this.lifespan -= 7; // 稍微減慢淡出速度
    this.size *= 0.94; // 粒子在飛散過程中會逐漸縮小
  }

  display() {
    push();
    noStroke();
    let c = color(this.color);
    fill(red(c), green(c), blue(c), this.lifespan);
    ellipse(this.pos.x, this.pos.y, this.size); // 使用動態大小繪製
    pop();
  }

  isDead() {
    return this.lifespan <= 0 || this.size < 0.5;
  }
}

// 新增 Missile 類別
class Missile {
  constructor(x, y, angle) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.fromAngle(angle).mult(10); // 飛彈速度設定為 10
    this.radius = 5; // 飛彈的碰撞半徑
    this.active = true; // 飛彈是否活躍 (用於判斷是否需要更新和顯示)
  }

  update() {
    this.pos.add(this.vel);
    // 檢查飛彈是否超出畫面邊界
    if (this.pos.x < 0 || this.pos.x > width || this.pos.y < 0 || this.pos.y > height) {
      this.active = false; // 超出畫面則設為不活躍
    }
  }

  display() {
    if (this.active) { // 只顯示活躍的飛彈
      push();
      translate(this.pos.x, this.pos.y);
      rotate(this.vel.heading()); // 讓飛彈的繪製方向與其速度方向一致
      fill(255, 255, 0); // 飛彈顏色 (黃色)
      noStroke();
      rect(-this.radius * 2, -this.radius / 2, this.radius * 4, this.radius); // 繪製一個簡單的矩形飛彈
      pop();
    }
  }

  // 檢查飛彈與怪物的碰撞
  checkCollision(monster) {
    let d = dist(this.pos.x, this.pos.y, monster.pos.x, monster.pos.y);
    return d < this.radius + monster.size / 2; // 如果距離小於兩者半徑之和，則發生碰撞
  }
}

// 新增 PowerUp 類別
class PowerUp {
  constructor(x, y) {
    this.baseX = x; // 紀錄道具產生時的水平位置
    this.pos = createVector(x, y);
    this.vel = createVector(0, 1.5); // 道具下落速度減慢，增加停留時間
    this.angle = random(TWO_PI);   // 隨機初始相位，讓不同道具擺動錯開
    this.size = 50; // 尺寸變大
    this.active = true;
  }

  update() {
    this.pos.y += this.vel.y; // 保持穩定的向下掉落
    this.angle += 0.05;       // 擺動的速度 (數字越大擺動越快)
    // 利用 sin 函數計算偏移量，40 為擺動的幅度 (左右各 40 像素)
    this.pos.x = this.baseX + sin(this.angle) * 40;

    // 如果超出畫面底部則消失
    if (this.pos.y > height + this.size) {
      this.active = false;
    }
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    fill(0, 255, 150); // 道具顏色（亮綠色）
    stroke(255);
    strokeWeight(2);
    ellipse(0, 0, this.size);
    fill(255);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(20); // 配合尺寸增加文字大小
    text("+5s", 0, 0); // 顯示效果文字
    pop();
  }

  checkCollision(missile) {
    let d = dist(this.pos.x, this.pos.y, missile.pos.x, missile.pos.y);
    return d < this.size / 2 + missile.radius;
  }
}
