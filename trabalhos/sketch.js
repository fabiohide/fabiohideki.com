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

  

  cenario_1 = new Cenario(imagemCena_1, imagemCena_2, 0.15,);
  cenario_3 = new Cenario(imagemCena_3, imagemCena_4, 0.25,);
  cenario_5 = new Cenario(imagemCena_5, imagemCena_5, 0.30,);


}

function draw() {
  background(255);

  cenario_1.exibe();
  cenario_1.move();
  cenario_3.exibe();
  cenario_3.move();
  cenario_5.exibe();
  cenario_5.move();

}

function preload() {
  imagemCena_5 = loadImage('modulos/layer5.png');
  imagemCena_1 = loadImage('modulos/layer1.png');
  imagemCena_2 = loadImage('modulos/layer2.png');
  imagemCena_3 = loadImage('modulos/layer3.png');
  imagemCena_4 = loadImage('modulos/layer4.png');



}