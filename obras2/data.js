var APP_DATA = {
  "scenes": [
    {
      "id": "0-verde",
      "name": "verde",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1536,
      "initialViewParameters": {
        "yaw": 1.4851962945266566,
        "pitch": -0.029362869939522085,
        "fov": 1.61129469758412
      },
      "linkHotspots": [
        {
          "yaw": 1.6234874494997023,
          "pitch": 0.31071580605711624,
          "rotation": 0,
          "target": "1-azul"
        }
      ],
      "infoHotspots": []
    },
    {
      "id": "1-azul",
      "name": "azul",
      "levels": [
        {
          "tileSize": 256,
          "size": 256,
          "fallbackOnly": true
        },
        {
          "tileSize": 512,
          "size": 512
        },
        {
          "tileSize": 512,
          "size": 1024
        },
        {
          "tileSize": 512,
          "size": 2048
        }
      ],
      "faceSize": 1536,
      "initialViewParameters": {
        "yaw": -1.57523825966579,
        "pitch": 0.10553700349539952,
        "fov": 1.61129469758412
      },
      "linkHotspots": [
        {
          "yaw": 1.5442732147674203,
          "pitch": 0.32417680248089553,
          "rotation": 0,
          "target": "0-verde"
        }
      ],
      "infoHotspots": []
    }
  ],
  "name": "Project Title",
  "settings": {
    "mouseViewMode": "drag",
    "autorotateEnabled": false,
    "fullscreenButton": true,
    "viewControlButtons": true
  }
};
