const cloudinary = require('cloudinary').v2;
const mongoose = require('mongoose');

cloudinary.config({
  cloud_name: 'dqb3zf1bw',
  api_key: '388267589543518',
  api_secret: 'rKOS1NkJwtQcRxdmawOOIbjzXqg'
});

const highResStudioPhotos = {
  almonds: 'https://images.pexels.com/photos/12326584/pexels-photo-12326584.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200',
  cashews: 'https://images.pexels.com/photos/36631827/pexels-photo-36631827.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200',
  pistachios: 'https://images.pexels.com/photos/19052912/pexels-photo-19052912.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200',
  dates: 'https://images.pexels.com/photos/13682249/pexels-photo-13682249.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200'
};

async function upgradePhotos() {
  console.log('Uploading ultra-HD studio photos to Cloudinary...');
  const uploaded = {};
  for (const [key, url] of Object.entries(highResStudioPhotos)) {
    console.log('Uploading clean HD', key, '...');
    const res = await cloudinary.uploader.upload(url, {
      folder: 'krisha_dry_fruits/products_hd',
      public_id: 'studio_' + key,
      overwrite: true
    });
    uploaded[key] = res.secure_url;
    console.log('  -> Uploaded:', res.secure_url);
  }

  const uri = 'mongodb+srv://sanjay:Eternal_Flame@cluster0.t8wbojh.mongodb.net/krisha_dry_fruits?retryWrites=true&w=majority';
  await mongoose.connect(uri);
  const col = mongoose.connection.db.collection('products');

  await col.updateOne(
    { name: /California Nonpareil/i },
    { $set: { image: uploaded.almonds, gallery: [uploaded.almonds] } }
  );
  await col.updateOne(
    { name: /W180/i },
    { $set: { image: uploaded.cashews, gallery: [uploaded.cashews] } }
  );
  await col.updateOne(
    { name: /Iranian Jumbo/i },
    { $set: { image: uploaded.pistachios, gallery: [uploaded.pistachios] } }
  );
  await col.updateOne(
    { name: /Royal Saudi Medjool/i },
    { $set: { image: uploaded.dates, gallery: [uploaded.dates] } }
  );

  console.log('MongoDB products updated with crystal-clear HD studio images!');
  await mongoose.connection.close();
}

upgradePhotos().catch(console.error);

