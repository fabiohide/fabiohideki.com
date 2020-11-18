let cor = 120;

/*function windowResized() {
  resizeCanvas (windowWidth-30, 500);
}*/

function setup() {
  canvas = createCanvas(windowWidth - 60, 540);
  //frameRate(60);
  canvas.position(30, 100);

  

  cenario_1 = new Cenario(imagemCena_1, 0.4,);
  //cenario_2 = new Cenario(imagemCena_2, 1.5);
  cenario_3 = new Cenario(imagemCena_3, 0.6,);
  //cenario_4 = new Cenario(imagemCena_4, 2.5);
  cenario_5 = new Cenario(imagemCena_5, 0.8,);
  //cenario_6 = new Cenario(imagemCena_6, 3);


}

function draw() {
  background(255);

  cenario_1.exibe();
  cenario_1.move();
  //cenario_2.exibe();
  //cenario_2.move();
  cenario_3.exibe();
  cenario_3.move();
  //cenario_4.exibe();
  //cenario_4.move();
  cenario_5.exibe();
  cenario_5.move();

  fill(cor);
  noStroke();
  circle(windowWidth / 2 - 20, 30, 20);

  if(mouseX < windowWidth/2){
    cor=240;
  }else{
    cor=40;
  }

}

function preload() {
  imagemCena_1 = loadImage('modulos/layer1.png');
  imagemCena_2 = loadImage('modulos/layer2.png');
  imagemCena_3 = loadImage('modulos/layer3.png');
  imagemCena_4 = loadImage('modulos/layer4.png');
  imagemCena_5 = loadImage('modulos/layer5.png');
  imagemCena_6 = loadImage('modulos/layer5-2.png');

}