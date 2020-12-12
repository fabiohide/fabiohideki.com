var cnv;

function centerCanvas() {
  var x = (windowWidth-width)/5;
  var y = 100;
  cnv.position(x, y);
}


function windowResized() {
  centerCanvas();
}



function setup() {
  cnv = createCanvas(400, 540);
  centerCanvas();
  //frameRate(60);

  

  cenario_1 = new Cenario(imagemCena_1, imagemCena_2, 0.1,);
  //cenario_2 = new Cenario(imagemCena_2, 1.5);
  cenario_3 = new Cenario(imagemCena_3, imagemCena_4, 0.2,);
  //cenario_4 = new Cenario(imagemCena_4, 2.5);
  cenario_5 = new Cenario(imagemCena_5, imagemCena_5, 0.25,);
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

}

function preload() {
  imagemCena_1 = loadImage('modulos/layer1.png');
  imagemCena_2 = loadImage('modulos/layer2.png');
  imagemCena_3 = loadImage('modulos/layer3.png');
  imagemCena_4 = loadImage('modulos/layer4.png');
  imagemCena_5 = loadImage('modulos/layer5.png');
  imagemCena_6 = loadImage('modulos/layer5-2.png');

}