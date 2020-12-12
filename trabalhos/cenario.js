class Cenario {
  
    constructor(imagem, imagem2, velocidade,) {
      this.imagem = imagem;
      this.imagem2 = imagem2;
      this.velocidade = velocidade;
      this.mw = 1500;
      this.x1 = 0;
      this.x2 =  this.mw;
     
      
    }
  
    exibe() {
      image(this.imagem, this.x1, 0,  this.mw, height);
      image(this.imagem2, this.x2, 0,  this.mw, height);
    }
  
    move() {
      this.x1 = this.x1 - this.velocidade;
      this.x2 = this.x2 - this.velocidade;
  
      if (this.x1 < - this.mw+this.velocidade) {
        this.x1 =  this.mw;
      }
      if (this.x2 < - this.mw+this.velocidade) {
        this.x2 =  this.mw;
      }
    }
  }