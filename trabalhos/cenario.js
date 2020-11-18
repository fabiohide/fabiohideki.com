class Cenario {
  
    constructor(imagem, velocidade,) {
      this.imagem = imagem;
      this.velocidade = velocidade;
      this.x1 = 0;
      this.x2 = width;
      
      
    }
  
    exibe() {
      image(this.imagem, this.x1, 0, width, height);
      image(this.imagem, this.x2, 0, width, height);
    }
  
    move() {
      let x3;
      if(mouseX < windowWidth/2){
        x3 = 2;
      }else{
        x3 = 10;
      }
      this.x1 = this.x1 - this.velocidade*x3;
      this.x2 = this.x2 - this.velocidade*x3;
  
      if (this.x1 < -width+this.velocidade*x3) {
        this.x1 = width
      }
      if (this.x2 < -width+this.velocidade*x3) {
        this.x2 = width
      }
    }
  }