import type { Product } from "@/lib/types";

const fallbackImage = "/placeholder.svg";

const productImagesById: Record<number, string> = {
  1: "/116plus-smart-watch.webp",
  2: "/type-c-usb-converter.webp",
  3: "/2-4g-game-controller.webp",
  4: "/wireless-condenser-microphone.webp",
  5: "/3-axis-gimbal.webp",
  6: "/300mbps-wifi-repeater.webp",
  7: "/4k-hdmi-splitter.webp",
  8: "/1080p-spy-glasses-camera.webp",
  9: "/1080p-mini-wifi-spy-camera.webp",
  10: "/1080p-wearable-chest-recorder.webp",
  11: "/black-hoodie-streetwear.webp",
  12: "/mens-v-neck-tshirt.webp",
  13: "/unisex-sports-digital-watch.webp",
  14: "/womens-crossbody-bag.webp",
  15: "/aviator-sunglasses-uv400.jpg",
  16: "/12v-car-kettle.webp",
  17: "/360-phone-holder.webp",
  18: "/360-tripod-stand.webp",
  19: "/octangle-softbox.jpeg",
  20: "/car-fm-transmitter.webp",
  21: "/body-slimming-cream.jpg",
  22: "/vitamin-c-serum.webp",
  23: "/facial-cleanser-brush.jpg",
  24: "/hair-growth-oil.webp",
  25: "/teeth-whitening-powder.webp",
  26: "/phone-screen-magnifier.webp",
  27: "/led-desk-lamp.jpg",
  28: "/air-humidifier-300ml.jpg",
  29: "/vacuum-flask-500ml.jpg",
  30: "/rgb-led-strip-lights.webp"
};

const categoryProfiles: Record<string, { brand: string; sizes: string[]; colors: string[]; code: string }> = {
  electronic: {
    brand: "Faith Tech",
    sizes: ["Standard"],
    colors: ["Black", "White"],
    code: "ELC"
  },
  fashion: {
    brand: "Faith Wear",
    sizes: ["S", "M", "L", "XL"],
    colors: ["Black", "White", "Navy", "Grey"],
    code: "FSN"
  },
  "fashion-accessories": {
    brand: "Faith Style",
    sizes: ["Standard"],
    colors: ["Black", "Brown", "Gold", "Silver"],
    code: "FAS"
  },
  "hardware-automobile": {
    brand: "Faith Auto",
    sizes: ["Standard"],
    colors: ["Black", "Grey", "Red"],
    code: "HWA"
  },
  "health-beauty": {
    brand: "Faith Care",
    sizes: ["30ml", "50ml", "200g"],
    colors: ["Natural", "Classic"],
    code: "HLB"
  },
  "home-living": {
    brand: "Faith Home",
    sizes: ["Small", "Medium", "Large"],
    colors: ["Black", "White", "Blue"],
    code: "HML"
  }
};

const product = (
  id: number,
  name: string,
  category: Product["category"],
  originalPrice: number,
  salePrice: number,
  rating: number,
  sold: number,
  descriptionSw: string,
  whoForSw: string,
  inStock = true,
  isNew = false,
  bestSelling = false
): Product => {
  const image = productImagesById[id] ?? fallbackImage;
  const profile = categoryProfiles[category] ?? {
    brand: "Faith Select",
    sizes: ["Standard"],
    colors: ["Black"],
    code: "GEN"
  };
  const sku = `${profile.code}-${String(id).padStart(4, "0")}`;

  return {
    id: String(id),
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
    category,
    sku,
    brand: profile.brand,
    originalPrice,
    salePrice,
    rating,
    inStock,
    image,
    gallery: [image, image, image],
    sizeOptions: profile.sizes,
    colorOptions: profile.colors,
    sold,
    isNew,
    bestSelling,
    descriptionSw,
    benefitsSw: [
      "Ubora wa juu uliothibitishwa",
      "Malipo baada ya kupokea bidhaa",
      "Tunafikisha oda Tanzania nzima kwa gharama nafuu ya usafiri"
    ],
    whoForSw,
    createdAt: new Date(2025, 11, id).toISOString()
  };
};

export const products: Product[] = [
  product(1, "116plus Smart Watch with Blood Pressure Monitor", "electronic", 30000, 21000, 4.4, 184, "Saa janja inayokusaidia kufuatilia muda na hali ya mwili kila siku.", "Wapenzi wa teknolojia na watu wanaopenda kufuatilia afya."),
  product(2, "Type C Female to USB2.0 Male Converter", "electronic", 10000, 7000, 4.2, 349, "Kigeuzi cha haraka na imara kwa kuunganisha vifaa vyako kwa urahisi.", "Watu wanaotumia simu na vifaa vya kisasa kila siku."),
  product(3, "2.4G Game Controller Gamepad Wireless Joystick", "electronic", 93000, 65000, 4.7, 129, "Gamepad yenye mwitikio wa juu kwa mchezo laini na wa kufurahisha.", "Wachezaji wa michezo ya video wa simu na TV box."),
  product(4, "2.4G Wireless Bluetooth Condenser Microphone", "electronic", 193000, 135000, 4.6, 95, "Kipaza sauti chenye sauti safi kwa kurekodi, live, na mahojiano.", "Watengenezaji wa maudhui, waimbaji, na waandishi wa sauti.", true, true),
  product(5, "3 Axis Gimbal Stabilizer", "electronic", 500000, 350000, 4.8, 68, "Gimbal yenye uthabiti wa juu kwa video zenye mwonekano wa kitaalamu.", "Wapiga video na wabunifu wa maudhui ya mitandaoni.", true, false, true),
  product(6, "300Mbps Wireless WIFI Repeater Extender 2.4G", "electronic", 86000, 60000, 4.5, 143, "Kifaa cha kuongeza kasi na umbali wa intaneti nyumbani au ofisini.", "Watu wanaohitaji mtandao kufika kila kona ya nyumba."),
  product(7, "4K HDMI Splitter Full HD 1080p Video Switch", "electronic", 72000, 50000, 4.1, 81, "Splitta ya HDMI kwa kugawa video kwenye skrini nyingi bila kupunguza ubora.", "Wanaotumia TV nyingi, projector, au mfumo wa maonyesho."),
  product(8, "1080P HD Spy Glasses Camera & Driving Video Recorder", "electronic", 215000, 150000, 4.3, 72, "Miwani yenye kamera ya HD kwa kurekodi video kwa urahisi ukiwa safarini.", "Madereva, wasafiri, na wabunifu wa vlog.", true, true),
  product(9, "1080P Mini WiFi Spy Camera HD Wireless Security", "electronic", 93000, 65000, 4.0, 112, "Kamera ndogo ya usalama yenye WiFi kwa ulinzi wa nyumba na ofisi.", "Watu wanaotaka kuongeza usalama wa maeneo yao."),
  product(10, "1080P Wearable WiFi Chest Recorder Meeting Camera", "electronic", 122000, 85000, 4.4, 77, "Kamera ya kuvaa yenye ubora wa HD kwa mikutano na ushuhuda wa video.", "Wataalamu wa field work na waandishi wa habari."),
  product(11, "Premium Black Hoodie Streetwear", "fashion", 57000, 40000, 4.7, 221, "Hoodie ya kisasa yenye kitambaa kizito na starehe ya hali ya juu.", "Wapenzi wa streetwear na mavazi ya kila siku.", true, false, true),
  product(12, "Men's Classic V-Neck T-Shirt", "fashion", 29000, 20000, 4.3, 256, "T-shirt nyepesi na inayokaa vizuri mwilini kwa matumizi ya kila siku.", "Wanaume wanaotaka mwonekano safi na rahisi."),
  product(13, "Unisex Sports Digital Watch", "fashion-accessories", 36000, 25000, 4.5, 198, "Saa ya michezo isiyopitisha maji kirahisi na yenye muonekano wa kuvutia.", "Wanariadha na watu wanaopenda saa za matumizi ya kila siku."),
  product(14, "Women's Leather Crossbody Bag", "fashion-accessories", 72000, 50000, 4.6, 174, "Mkoba wa ngozi wa kuvuka begani wenye nafasi ya kutosha na mtindo wa kisasa.", "Wanawake wanaotaka mkoba wa kazi na matembezi."),
  product(15, "Polarized Aviator Sunglasses UV400", "fashion-accessories", 43000, 30000, 4.4, 188, "Miwani yenye kinga ya UV400 kwa ulinzi wa macho dhidi ya jua kali.", "Madereva, wasafiri, na watumiaji wa kila siku."),
  product(16, "450ml 12V Electric Heating Car Kettle", "hardware-automobile", 72000, 50000, 4.2, 119, "Kettle ya gari inayopasha maji kwa safari ndefu bila usumbufu.", "Madereva wa safari ndefu na wanaopenda chai/kahawa njiani."),
  product(17, "360 Degree Rotation Smart Phone Holder Auto Selfie", "hardware-automobile", 57000, 40000, 4.3, 167, "Holder ya simu inayozunguka nyuzi 360 kwa video na selfie bora.", "Wapenda kurekodi video ndani ya gari au nyumbani."),
  product(18, "360 Tripod Stand for DSLR Camera and iPhone", "hardware-automobile", 122000, 85000, 4.6, 104, "Tripod imara kwa DSLR na simu kwa picha zilizo tulivu.", "Wapiga picha na creators wa maudhui."),
  product(19, "20cm Durable Photography Accessories Octangle Style Softbox", "hardware-automobile", 50000, 35000, 4.1, 94, "Softbox ya mwanga laini kwa picha na video zenye ubora bora.", "Wapiga picha wa studio ndogo na wauzaji mtandaoni."),
  product(20, "Car Bluetooth FM Transmitter Dual USB Charger", "hardware-automobile", 36000, 25000, 4.4, 243, "FM transmitter yenye chaji mbili za USB kwa muziki na chaji kwa wakati mmoja.", "Madereva wanaotaka urahisi wa muziki na chaji barabarani.", true, false, true),
  product(21, "3Days Body Slimming Cream 200gm", "health-beauty", 50000, 35000, 4.0, 191, "Cream maalum ya kuimarisha ngozi na kusaidia mwonekano wa mwili.", "Watu wanaotaka huduma ya mwili nyumbani."),
  product(22, "Vitamin C Brightening Face Serum 30ml", "health-beauty", 43000, 30000, 4.6, 266, "Serum yenye Vitamin C kwa kung'arisha ngozi na kupunguza madoa.", "Wanaotaka ngozi yenye mwanga na afya."),
  product(23, "Electric Facial Cleanser Brush Waterproof", "health-beauty", 57000, 40000, 4.5, 147, "Brashi ya kusafisha uso kwa kina, salama na rahisi kutumia.", "Wapenzi wa skincare ya kila siku."),
  product(24, "Hair Growth Essential Oil 30ml", "health-beauty", 36000, 25000, 4.3, 231, "Mafuta maalum ya kusaidia ukuaji wa nywele na kuzipa uimara.", "Wenye nywele nyembamba au wanaotaka kuongeza afya ya nywele."),
  product(25, "Teeth Whitening Powder Activated Charcoal", "health-beauty", 29000, 20000, 4.2, 205, "Poda ya mkaa wa asili kusaidia kung'arisha meno kwa upole.", "Watu wanaotaka tabasamu jeupe kwa gharama nafuu."),
  product(26, "10inch Phone Screen Magnifier", "home-living", 36000, 25000, 4.1, 158, "Kikuza skrini cha simu kwa kutazama video kwa ukubwa zaidi.", "Wapenzi wa filamu na video za simu."),
  product(27, "LED Desk Lamp USB Rechargeable", "home-living", 43000, 30000, 4.5, 176, "Taa ya mezani ya LED inayochajiwa kwa USB kwa mwanga unaolinda macho.", "Wanafunzi na wafanyakazi wa ofisini."),
  product(28, "Mini Portable Air Humidifier 300ml", "home-living", 50000, 35000, 4.4, 139, "Humidifier ndogo kwa hewa safi na unyevunyevu stahiki ndani ya chumba.", "Watu wanaotaka hewa bora nyumbani au ofisini."),
  product(29, "Stainless Steel Vacuum Flask 500ml", "home-living", 36000, 25000, 4.6, 268, "Flask ya chuma inayohifadhi joto na ubaridi kwa muda mrefu.", "Wasafiri, wanafunzi, na wafanyakazi wa kila siku."),
  product(30, "RGB LED Strip Lights 5M Remote Control", "home-living", 43000, 30000, 4.5, 197, "Taa za strip zenye rangi nyingi kwa kupamba nyumba au biashara.", "Wapenzi wa mapambo ya ndani na biashara za kisasa.", true, true)
];

export const productsById = new Map(products.map((item) => [item.id, item]));
