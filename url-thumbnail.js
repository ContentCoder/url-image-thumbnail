/* 
 * url-thumbnail.js
 * 
 * URL image thumbnail.
 * 
 * version: 0.0.1
 * create date: 2014-2-28
 * update date: 2014-2-28
 */

var util	= require('util'), 
		path	= require('path'), 
		aws 	= require('aws-sdk'), 
		uc 		= require(path.join(__dirname, '../s3-url-cache/url-cache.js')), 
		tc 		= require(path.join(__dirname, '../image-thumbnail-cache/thumbnail-cache.js'));

// aws init
aws.config.loadFromPath(path.join(__dirname, 'awsconfig.json'));
var s3 = new aws.S3();

/* 
 * Get image thumbnail object.
 * 
 * Parameters: 
 *	imageUrl: (String) image url
 *	options: (Object) thumbnail options
 *		width: (Number) thumbnail width
 *		height: (Number) thumbnail heigth
 *		crop: (String) crop method, 'Center' or 'North'
 * 
 * Callback:
 *	callback: (Function) function(err, data) {} 
 *		err: (Object) error object, set to null if succeed
 *		data: (Object) thumbnail object data
 *			Body: (Buffer) thumbnail buffer
 *			ContentLength: (Number) size of the buffer in bytes
 *			ContentType: (String) a standard MIME type describing the format of the buffer
 *			ETag: (String) etag
 *			LastModified: (Date) last modified date of the object
 */
function thumbnailObject(imageUrl, options, callback) {
	create(imageUrl, options, function(err, thumbItem) {
		if (err) {
			callback(err, null);
			return;
		}

		var thumb = {};
		thumb.Bucket  = thumbItem.ThumbBucket.S;
		thumb.Key     = thumbItem.ThumbKey.S;
		s3.getObject(thumb, function(err, data) {
			if (err) {
				callback(err, null);
				return;
			} 

			callback(null, data);
		});		// s3.getObject
	});		// create
}

/* 
 * Get image thumbnail URL.
 * 
 * Parameters: 
 *	imageUrl: (String) image URL
 *  options: (Object) thumbnail options
 *    width: (Number) thumbnail width
 *    height: (Number) thumbnail heigth
 *    crop: (String) crop method, 'Center' or 'North'
 * 
 * Callback:
 *	callback: (Function) function(err, data) {}
 *		err: (Object) error object, set to null if succeed
 *		data: (Object) thumbnail URL data
 *			url: (String) thumbnail url
 *			expires: (Number) the number of seconds to expire the pre-signed URL operation in
 */
function thumbnailUrl(imageUrl, options, callback) {
  create(imageUrl, options, function(err, thumbItem) {
    if (err) {
      callback(err, null);
      return;
    }

    var thumb = {};
    thumb.Bucket  = thumbItem.ThumbBucket.S;
    thumb.Key     = thumbItem.ThumbKey.S;
		thumb.Expires = 60;
    s3.getSignedUrl(thumb, function(err, thumbUrl) {
      if (err) {
        callback(err, null);
				return;
      } 
				
			var data = {};
			data.url			= thumbUrl;
			data.expires	= 60;
      callback(null, data);
    });   // s3.getSignedUrl
  });   // create
}

/* 
 * Create image thumbnail.
 */
function create(imageUrl, options, callback) {
	uc.cache(imageUrl, function(err, cachedImageItem) {
		if (err) {
			callback(err, null);
			return;
		}

		var image = {};
		image.Bucket	= cachedImageItem.Bucket.S;
		image.Key     = cachedImageItem.Key.S;
		tc.cache(image, options, function(err, cachedThumbItem) {
			if (err) {
				callback(err, null);
				return;
			} 
		
			callback(null, cachedThumbItem);
		});		// tc.cache
	});		// uc.cache
}

exports.thumbnailObject = thumbnailObject;
exports.thumbnailUrl		= thumbnailUrl;

