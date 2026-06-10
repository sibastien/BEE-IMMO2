const WATERMARK_PUBLIC_ID = process.env.CLOUDINARY_WATERMARK_PUBLIC_ID || 'bee-consulting:watermark-logo';
const WATERMARK_TRANSFORMATION = `q_auto,f_auto/l_${WATERMARK_PUBLIC_ID},fl_relative,w_0.18,o_58,g_south_east,x_24,y_24/fl_layer_apply`;

const getWatermarkedImageUrl = (imageUrl) => {
  if (!imageUrl || !/^https?:\/\/res\.cloudinary\.com\//i.test(imageUrl)) {
    return imageUrl;
  }

  if (imageUrl.includes(`/l_${WATERMARK_PUBLIC_ID},`)) {
    return imageUrl;
  }

  return imageUrl.replace('/image/upload/', `/image/upload/${WATERMARK_TRANSFORMATION}/`);
};

module.exports = {
  getWatermarkedImageUrl
};
