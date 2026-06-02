import { useEffect, useRef } from "react";

export default function LogoCanvas({ size = 40, color = "rgb(241, 190, 90)", style }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Inkscape Output 드로잉 코드 이식
    ctx.save();
    // 210x297 기준의 좌표계를 캔버스 실제 크기 비율에 맞춰 스케일링
    const scaleX = canvas.width / 210;
    const scaleY = canvas.height / 297;
    ctx.scale(scaleX, scaleY);

    // #layer1
    // #g1
    ctx.save();
    ctx.transform(3.686740, 0.000000, 0.000000, 3.686740, -719.626000, -351.133000);
    
    // #path286
    ctx.save();
    ctx.beginPath();
    ctx.transform(0.352778, 0.000000, 0.000000, -0.352778, 250.057000, 137.337000);
    ctx.fillStyle = color;
    ctx.moveTo(0.000000, 0.000000);
    ctx.lineTo(0.000000, -69.865000);
    ctx.bezierCurveTo(-41.859000, -109.255000, -107.463000, -109.255000, -149.322000, -69.865000);
    ctx.lineTo(-149.322000, 0.000000);
    ctx.lineTo(-149.322000, 69.906000);
    ctx.bezierCurveTo(-129.031000, 89.007000, -102.653000, 99.490000, -74.661000, 99.490000);
    ctx.bezierCurveTo(-46.669000, 99.490000, -20.291000, 89.007000, 0.000000, 69.906000);
    ctx.closePath();
    ctx.moveTo(0.000000, 76.814000);
    ctx.bezierCurveTo(-20.811000, 94.601000, -46.989000, 104.302000, -74.661000, 104.302000);
    ctx.bezierCurveTo(-102.332000, 104.302000, -128.511000, 94.601000, -149.322000, 76.814000);
    ctx.bezierCurveTo(-150.852000, 75.506000, -152.354000, 74.158000, -153.824000, 72.763000);
    ctx.lineTo(-153.824000, 72.223000);
    ctx.lineTo(-153.824000, 0.000000);
    ctx.lineTo(-153.824000, -69.633000);
    ctx.lineTo(-153.824000, -72.764000);
    ctx.bezierCurveTo(-152.351000, -74.160000, -150.849000, -75.508000, -149.322000, -76.811000);
    ctx.bezierCurveTo(-127.885000, -95.100000, -101.274000, -104.248000, -74.661000, -104.248000);
    ctx.bezierCurveTo(-48.048000, -104.248000, -21.437000, -95.100000, 0.000000, -76.811000);
    ctx.bezierCurveTo(1.527000, -75.508000, 3.029000, -74.160000, 4.502000, -72.764000);
    ctx.lineTo(4.502000, -67.044000);
    ctx.lineTo(4.502000, 0.000000);
    ctx.lineTo(4.502000, 69.633000);
    ctx.lineTo(4.502000, 72.763000);
    ctx.bezierCurveTo(3.032000, 74.158000, 1.530000, 75.506000, 0.000000, 76.814000);
    ctx.fill();
    ctx.restore();
    
    // #path288
    ctx.save();
    ctx.beginPath();
    ctx.transform(0.352778, 0.000000, 0.000000, -0.352778, 205.398000, 121.986000);
    ctx.fillStyle = color;
    ctx.moveTo(0.000000, 0.000000);
    ctx.lineTo(0.573000, -0.294000);
    ctx.bezierCurveTo(1.080000, -0.553000, 1.569000, -0.794000, 2.038000, -1.026000);
    ctx.bezierCurveTo(5.737000, -2.850000, 7.971000, -3.952000, 7.971000, -8.508000);
    ctx.lineTo(7.971000, -80.018000);
    ctx.bezierCurveTo(7.971000, -84.572000, 5.741000, -85.673000, 2.045000, -87.497000);
    ctx.bezierCurveTo(1.575000, -87.730000, 1.086000, -87.972000, 0.577000, -88.232000);
    ctx.lineTo(0.006000, -88.526000);
    ctx.lineTo(0.872000, -89.187000);
    ctx.lineTo(15.859000, -89.187000);
    ctx.lineTo(15.859000, 0.661000);
    ctx.lineTo(0.868000, 0.661000);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    
    // #path290
    ctx.save();
    ctx.beginPath();
    ctx.transform(0.352778, 0.000000, 0.000000, -0.352778, 221.884000, 133.801000);
    ctx.fillStyle = color;
    ctx.moveTo(0.000000, 0.000000);
    ctx.lineTo(0.000000, 55.387000);
    ctx.lineTo(-14.986000, 55.387000);
    ctx.lineTo(-15.852000, 54.725000);
    ctx.lineTo(-15.281000, 54.432000);
    ctx.bezierCurveTo(-14.771000, 54.170000, -14.279000, 53.928000, -13.808000, 53.696000);
    ctx.bezierCurveTo(-10.116000, 51.874000, -7.888000, 50.774000, -7.888000, 46.222000);
    ctx.lineTo(-7.888000, 0.000000);
    ctx.bezierCurveTo(-7.888000, -6.995000, -8.918000, -8.755000, -16.644000, -8.755000);
    ctx.lineTo(-27.181000, -8.755000);
    ctx.lineTo(-27.181000, -12.784000);
    ctx.lineTo(-16.644000, -12.784000);
    ctx.bezierCurveTo(-8.918000, -12.784000, -7.888000, -14.544000, -7.888000, -21.540000);
    ctx.lineTo(-7.888000, -66.210000);
    ctx.bezierCurveTo(-7.888000, -70.765000, -10.118000, -71.866000, -13.814000, -73.691000);
    ctx.bezierCurveTo(-14.284000, -73.924000, -14.773000, -74.165000, -15.282000, -74.426000);
    ctx.lineTo(-15.856000, -74.720000);
    ctx.lineTo(-14.986000, -75.379000);
    ctx.lineTo(28.920000, -75.379000);
    ctx.lineTo(28.920000, -62.890000);
    ctx.lineTo(28.259000, -62.023000);
    ctx.lineTo(27.966000, -62.596000);
    ctx.bezierCurveTo(27.705000, -63.103000, 27.464000, -63.594000, 27.232000, -64.064000);
    ctx.bezierCurveTo(25.409000, -67.758000, 24.309000, -69.990000, 19.753000, -69.990000);
    ctx.lineTo(0.000000, -69.990000);
    ctx.lineTo(0.000000, -21.540000);
    ctx.bezierCurveTo(0.000000, -14.544000, 1.030000, -12.784000, 8.756000, -12.784000);
    ctx.lineTo(41.276000, -12.784000);
    ctx.lineTo(41.276000, -55.694000);
    ctx.lineTo(56.263000, -55.694000);
    ctx.lineTo(57.129000, -55.033000);
    ctx.lineTo(56.557000, -54.739000);
    ctx.bezierCurveTo(56.049000, -54.479000, 55.559000, -54.238000, 55.089000, -54.005000);
    ctx.bezierCurveTo(51.394000, -52.180000, 49.163000, -51.079000, 49.163000, -46.525000);
    ctx.lineTo(49.163000, 24.984000);
    ctx.bezierCurveTo(49.163000, 29.541000, 51.397000, 30.642000, 55.096000, 32.467000);
    ctx.bezierCurveTo(55.566000, 32.699000, 56.054000, 32.940000, 56.562000, 33.199000);
    ctx.lineTo(57.135000, 33.493000);
    ctx.lineTo(56.267000, 34.154000);
    ctx.lineTo(41.276000, 34.154000);
    ctx.lineTo(41.276000, -8.755000);
    ctx.lineTo(8.756000, -8.755000);
    ctx.bezierCurveTo(1.030000, -8.755000, 0.000000, -6.995000, 0.000000, 0.000000);
    ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.restore();
  }, [size, color]);

  // Inkscape 비율 210:297 에 맞추어 실제 height 계산
  const calculatedHeight = size * (297 / 210);

  return (
    <canvas
      ref={canvasRef}
      width={210}
      height={297}
      style={{
        width: size,
        height: calculatedHeight,
        display: "block",
        ...style,
      }}
    />
  );
}
