import React, { useRef, useEffect } from "react";

const fontFace = `
@font-face {
  font-family: 'NanumBanJjagBanJjagByeor';
  src: url('/NanumBanJjagBanJjagByeor.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
}
`;

const GameLoading: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 게임 변수들
    let gameRunning = true;
    let score = 0;
    let gameSpeed = 2;
    let groundY = 220;
    let scaleFactor = 1;
    const baseWidth = 500;
    const baseHeight = 300;

    // 고양이 객체
    const cat = {
      x: 50,
      y: groundY - 20,
      width: 24,
      height: 20,
      velocityY: 0,
      jumping: false,
      grounded: true
    };
    let obstacles: any[] = [];

    function resizeCanvas() {
      // 고정 크기
      canvas.width = baseWidth;
      canvas.height = baseHeight;
      scaleFactor = 1;
      groundY = canvas.height * 0.85;
      if (cat.grounded) cat.y = groundY - 20;
      obstacles.forEach(obstacle => {
        obstacle.y = groundY - obstacle.height;
      });
    }

    function initGame() {
      gameRunning = true;
      score = 0;
      gameSpeed = 2;
      obstacles = [];
      cat.y = groundY - 20;
      cat.velocityY = 0;
      cat.jumping = false;
      cat.grounded = true;
    }

    function drawCat() {
      const scale = scaleFactor;
      ctx.fillStyle = '#888888';
      ctx.fillRect((cat.x + 4) * scale, (cat.y + 8) * scale, 16 * scale, 8 * scale);
      ctx.fillRect((cat.x + 8) * scale, cat.y * scale, 12 * scale, 12 * scale);
      ctx.fillRect((cat.x + 10) * scale, (cat.y - 2) * scale, 3 * scale, 4 * scale);
      ctx.fillRect((cat.x + 15) * scale, (cat.y - 2) * scale, 3 * scale, 4 * scale);
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect((cat.x + 11) * scale, cat.y * scale, 1 * scale, 2 * scale);
      ctx.fillRect((cat.x + 16) * scale, cat.y * scale, 1 * scale, 2 * scale);
      ctx.fillStyle = '#888888';
      ctx.fillRect((cat.x + 10) * scale, (cat.y + 4) * scale, 8 * scale, 6 * scale);
      ctx.fillRect((cat.x + 12) * scale, (cat.y + 2) * scale, 4 * scale, 2 * scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect((cat.x + 12) * scale, (cat.y + 3) * scale, 1 * scale, 1 * scale);
      ctx.fillRect((cat.x + 15) * scale, (cat.y + 3) * scale, 1 * scale, 1 * scale);
      ctx.fillStyle = '#FFB6C1';
      ctx.fillRect((cat.x + 13) * scale, (cat.y + 5) * scale, 2 * scale, 1 * scale);
      ctx.fillStyle = '#000000';
      ctx.fillRect((cat.x + 13) * scale, (cat.y + 6) * scale, 1 * scale, 1 * scale);
      ctx.fillRect((cat.x + 15) * scale, (cat.y + 6) * scale, 1 * scale, 1 * scale);
      ctx.fillStyle = '#888888';
      ctx.fillRect((cat.x + 6) * scale, (cat.y + 10) * scale, 12 * scale, 4 * scale);
      ctx.fillRect((cat.x + 6) * scale, (cat.y + 16) * scale, 3 * scale, 4 * scale);
      ctx.fillRect((cat.x + 11) * scale, (cat.y + 16) * scale, 3 * scale, 4 * scale);
      ctx.fillRect((cat.x + 16) * scale, (cat.y + 16) * scale, 3 * scale, 4 * scale);
      ctx.fillRect((cat.x + 2) * scale, (cat.y + 12) * scale, 4 * scale, 2 * scale);
      ctx.fillRect(cat.x * scale, (cat.y + 10) * scale, 4 * scale, 2 * scale);
      ctx.fillRect((cat.x - 2) * scale, (cat.y + 8) * scale, 3 * scale, 2 * scale);
    }

    function drawObstacle(obstacle: any) {
      ctx.fillStyle = obstacle.type === 'pencil' ? '#FFD700' : '#FFB6C1';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    }

    function drawBackground() {
      ctx.fillStyle = '#fefefe';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#535353';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.lineTo(canvas.width, groundY);
      ctx.stroke();
    }

    function createObstacle() {
      const canvasWidth = canvas.width / scaleFactor;
      const minDistance = 120;
      const maxDistance = 250;
      const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
      if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvasWidth - randomDistance) {
        const type = Math.random() > 0.5 ? 'pencil' : 'eraser';
        let obstacle: any = { x: canvasWidth, type };
        if (type === 'pencil') {
          obstacle.width = 12;
          obstacle.height = 40;
        } else {
          obstacle.width = 16;
          obstacle.height = Math.random() > 0.5 ? 20 : 30;
        }
        obstacle.y = groundY - obstacle.height;
        obstacles.push(obstacle);
      }
    }

    function checkCollision() {
      for (let obstacle of obstacles) {
        if (
          cat.x < obstacle.x + obstacle.width &&
          cat.x + cat.width > obstacle.x &&
          cat.y < obstacle.y + obstacle.height &&
          cat.y + cat.height > obstacle.y
        ) {
          return true;
        }
      }
      return false;
    }

    function updateGame() {
      if (!gameRunning) return;
      if (cat.jumping) {
        cat.velocityY += 0.5;
        cat.y += cat.velocityY;
        if (cat.y >= groundY - 20) {
          cat.y = groundY - 20;
          cat.velocityY = 0;
          cat.jumping = false;
          cat.grounded = true;
        }
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        if (obstacles[i].x + obstacles[i].width < 0) {
          obstacles.splice(i, 1);
          score += 1;
        }
      }
      createObstacle();
      if (checkCollision()) {
        gameRunning = false;
      }
      if (score > 0 && score % 100 === 0) {
        gameSpeed += 0.2;
      }
    }

    function render() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackground();
      drawCat();
      for (let obstacle of obstacles) {
        drawObstacle(obstacle);
      }
      // 점수 표시
      ctx.font = 'bold 24px NanumBanJjagBanJjagByeor, cursive';
      ctx.fillStyle = '#2a2a2a';
      ctx.fillText(score.toString().padStart(5, '0'), canvas.width - 110, 40);
      if (!gameRunning) {
        ctx.font = 'bold 32px NanumBanJjagBanJjagByeor, cursive';
        ctx.fillStyle = '#2a2a2a';
        ctx.fillText('GAME OVER', canvas.width / 2 - 90, canvas.height / 2);
      }
    }

    function gameLoop() {
      updateGame();
      render();
      animationRef.current = requestAnimationFrame(gameLoop);
    }

    function jump() {
      if (!gameRunning) {
        initGame();
      } else if (cat.grounded) {
        cat.velocityY = -12;
        cat.jumping = true;
        cat.grounded = false;
      }
    }

    // 키보드/터치/클릭 이벤트
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        jump();
      }
    };
    const handleTouch = (event: TouchEvent) => {
      event.preventDefault();
      jump();
    };
    const handleClick = (event: MouseEvent) => {
      event.preventDefault();
      jump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouch);
    window.addEventListener('click', handleClick);
    resizeCanvas();
    initGame();
    gameLoop();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouch);
      window.removeEventListener('click', handleClick);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 500,
        margin: "0 auto",
        background: "#fefefe",
        border: "3px solid #2a2a2a",
        borderRadius: 18,
        boxShadow: "0 8px 25px rgba(0,0,0,0.15)",
        position: "relative",
        padding: 0,
      }}
    >
      <style>{fontFace}</style>
      <canvas
        ref={canvasRef}
        width={500}
        height={300}
        style={{
          width: "100%",
          height: 300,
          display: "block",
          background: "#fefefe",
          borderRadius: 18,
        }}
      />
    </div>
  );
};

export default GameLoading; 