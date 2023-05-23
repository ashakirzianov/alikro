export type AssetKind = 'drawing' | 'illustration' | 'painting' | 'poster'
export type AssetData = {
    kind: AssetKind,
    name: string,
    title: string,
    year: number,
    material: string,
    width?: number,
    height?: number,
}
export const assets: AssetData[] = [{
    kind: 'drawing',
    name: 'dog.png',
    title: 'Dog',
    year: 2022,
    material: 'ink on paper, color pencil',
}, {
    kind: 'poster',
    name: 'in_bruges.png',
    title: 'In Bruges',
    year: 2022,
    material: 'gouache on paper, digital',
}, {
    kind: 'poster',
    name: 'contra_spem_spero!.png',
    title: 'Contra spem spero!',
    year: 2022,
    material: 'digital',

}, {
    kind: 'illustration',
    name: 'officer.png',
    title: 'Officer',
    year: 2022,
    material: 'digital',

}, {
    kind: 'poster',
    name: '93rd.jpeg',
    title: '93rd',
    year: 2022,
    material: 'digital',

}, {
    kind: 'poster',
    name: 'a&a.jpeg',
    title: 'A&A',
    year: 2022,
    material: 'digital',

}, {
    kind: 'illustration',
    name: 'Anna.png',
    title: 'Anna',
    year: 2020,
    material: 'digital',

}, {
    kind: 'poster',
    name: 'body.jpeg',
    title: 'Body',
    year: 2022,
    material: 'digital',

}, {
    kind: 'poster',
    name: 'bronx_gothic.jpeg',
    title: 'Bronx Gothic',
    year: 2022,
    material: 'colors pensil on paper, digital',

}, {
    kind: 'poster',
    name: 'darkside.jpeg',
    title: 'Darkside',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'dont_talk.jpeg',
    title: 'Romance',
    year: 2022,
    material: 'diital',
}, {
    kind: 'painting',
    name: 'Flower_1.HEIC',
    title: 'Flower 1',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_2.HEIC',
    title: 'Flower 2',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_3.HEIC',
    title: 'Flower 3',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_4.HEIC',
    title: 'Flower 4',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_5.HEIC',
    title: 'Flower 5',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_6.HEIC',
    title: 'Flower 6',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_7.HEIC',
    title: 'Flower 7',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_8.HEIC',
    title: 'Flower 8',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'painting',
    name: 'Flower_9.HEIC',
    title: 'Flower 9',
    year: 2023,
    material: 'gouache on paper',
}, {
    kind: 'illustration',
    name: 'frog.png',
    title: 'Frog',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'grand_spectacle_de_ballets.jpeg',
    title: 'Grand spectacle de ballets',
    year: 2022,
    material: 'digital',
}, {
    kind: 'illustration',
    name: 'greek_man.png',
    title: 'Greek man',
    year: 2019,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'estata_la_mano_di_dio.JPG',
    title: 'Estata la mano di dio',
    year: 2022,
    material: 'digital',

}, {
    kind: 'illustration',
    name: 'eye.jpg',
    title: 'An eye',
    year: 2020,
    material: 'digital',
}, {
    kind: 'illustration',
    name: 'happy.png',
    title: 'Happy',
    year: 2022,
    material: 'digital',
}, {
    kind: 'illustration',
    name: 'look.jpg',
    title: 'Look',
    year: 2021,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'in_decent.jpeg',
    title: 'In decent',
    year: 2022,
    material: 'ink on paper, digital',

}, {
    kind: 'poster',
    name: 'kyiv.png',
    title: 'Kyiv',
    year: 2022,
    material: 'mixed technique',
}, {
    kind: 'poster',
    name: 'LA.jpeg',
    title: 'LA',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'LACMA_2.png',
    title: 'LACMA',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'les_miserables.jpeg',
    title: 'Les miserables',
    year: 2022,
    material: 'mixed technique',
}, {
    kind: 'poster',
    name: 'look.jpeg',
    title: 'Look through',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'love.jpeg',
    title: 'LOVE',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'macbeth.jpeg',
    title: 'Macbeth',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'marshall.jpeg',
    title: 'Marshall',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'me.jpeg',
    title: 'Me',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'monstres.jpeg',
    title: 'Monstres',
    year: 2022,
    material: 'mixed technique',
}, {
    kind: 'poster',
    name: 'oper.jpeg',
    title: 'Oper',
    year: 2022,
    material: 'mixed technique',

}, {
    kind: 'poster',
    name: 'ophelia.jpeg',
    title: 'Ophelia',
    year: 2022,
    material: 'mixed technique',
}, {
    kind: 'poster',
    name: 'R&J.jpeg',
    title: 'R&J',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'Romeo_and_Juliet.jpeg',
    title: 'Romeo and Juliet',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'romeo&juliet.jpeg',
    title: 'Romeo&Juliet',
    year: 2022,
    material: 'digital',
}, {
    kind: 'poster',
    name: 'SPAM_1.jpeg',
    title: 'SPAM_1',
    year: 2022,
    material: 'marker on paper',
}, {
    kind: 'poster',
    name: 'SPAM_2.jpeg',
    title: 'SPAM_2',
    year: 2022,
    material: 'marker on paper',

}, {
    kind: 'illustration',
    name: 'pain.jbg',
    title: 'Pain',
    year: 2021,
    material: 'digital',

}, {
    kind: 'illustration',
    name: 'rabbit.jpg',
    title: 'Rabbit',
    year: 2020,
    material: 'digital',
}]
