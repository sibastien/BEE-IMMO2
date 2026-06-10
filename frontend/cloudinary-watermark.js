(function attachCloudinaryWatermark(window) {
  const watermarkPublicId = 'bee-consulting:watermark-logo';
  const transformation = `q_auto,f_auto/l_${watermarkPublicId},fl_relative,w_0.18,o_58,g_south_east,x_24,y_24/fl_layer_apply`;

  const withWatermark = (imageUrl) => {
    if (!imageUrl || !/^https?:\/\/res\.cloudinary\.com\//i.test(imageUrl)) {
      return imageUrl;
    }

    if (imageUrl.includes(`/l_${watermarkPublicId},`)) {
      return imageUrl;
    }

    return imageUrl.replace('/image/upload/', `/image/upload/${transformation}/`);
  };

  window.BeeImages = {
    ...(window.BeeImages || {}),
    withWatermark
  };
})(window);
