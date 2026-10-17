const fs = require('fs');
const path = require('path');

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING COMPREHENSIVE END-TO-END VERIFICATION');
  console.log('====================================================\n');

  const BASE_URL = 'http://localhost:5000/api/hotels';

  // Test 1: Health check
  console.log('1️⃣ Testing Server Health...');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log('   Status:', healthRes.status, healthData.status);
  if (healthRes.status !== 200) throw new Error('Health check failed');

  // Test 2: GET /api/hotels (with pagination)
  console.log('\n2️⃣ Testing GET /api/hotels (limit=3, page=1)...');
  const getRes = await fetch(`${BASE_URL}?limit=3&page=1`);
  const getData = await getRes.json();
  console.log('   Returned items:', getData.data.length, 'Total:', getData.pagination.total, 'Pages:', getData.pagination.totalPages);
  if (!getData.success || getData.data.length !== 3) throw new Error('GET pagination test failed');

  // Test 3: Search filter
  console.log('\n3️⃣ Testing Search Filter (search="Paris")...');
  const searchRes = await fetch(`${BASE_URL}?search=Paris`);
  const searchData = await searchRes.json();
  console.log('   Found matching hotels:', searchData.data.map(h => h.title));
  if (searchData.data.length === 0 || !searchData.data[0].title.toLowerCase().includes('paris')) {
    throw new Error('Search filter failed');
  }

  // Test 4: Price Range filter
  console.log('\n4️⃣ Testing Price Filter (minPrice=300, maxPrice=400)...');
  const priceRes = await fetch(`${BASE_URL}?minPrice=300&maxPrice=400`);
  const priceData = await priceRes.json();
  console.log('   Price filter results:', priceData.data.map(h => `${h.title}: $${h.price}`));
  for (const h of priceData.data) {
    const p = parseFloat(h.price);
    if (p < 300 || p > 400) throw new Error(`Price ${p} out of range!`);
  }

  // Test 5: Validation for Create (Empty Body)
  console.log('\n5️⃣ Testing POST /api/hotels Validation (Empty Body)...');
  const failPostRes = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const failPostData = await failPostRes.json();
  console.log('   Validation status:', failPostRes.status, 'Errors:', failPostData.errors);
  if (failPostRes.status !== 400 || !failPostData.errors.title || !failPostData.errors.price) {
    throw new Error('Create validation failed');
  }

  // Test 6: Create Hotel with multipart/form-data
  console.log('\n6️⃣ Testing POST /api/hotels (Multipart Form-Data with Image Upload)...');
  const testImagePath = path.join(__dirname, 'uploads', 'test-upload-sample.jpg');
  if (!fs.existsSync(testImagePath)) {
    fs.writeFileSync(testImagePath, 'FAKE_JPEG_IMAGE_DATA_CONTENT_123456');
  }

  const formData = new FormData();
  const fileBuffer = fs.readFileSync(testImagePath);
  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  formData.append('image', blob, 'sample-resort.jpg');
  formData.append('title', 'The Grand Royal Palace & Spa');
  formData.append('description', 'Spectacular luxury beachfront property with private heated infinity pools, spa sanctuaries, and five-star Michelin dining.');
  formData.append('latitude', '25.1972');
  formData.append('longitude', '55.2744');
  formData.append('price', '480.00');
  formData.append('address', 'Downtown Boulevard, Dubai, UAE');

  const createRes = await fetch(BASE_URL, {
    method: 'POST',
    body: formData,
  });
  const createData = await createRes.json();
  console.log('   Create status:', createRes.status, 'Message:', createData.message);
  console.log('   Created Hotel ID:', createData.data?.id, 'Image saved as:', createData.data?.image);
  if (createRes.status !== 201 || !createData.data?.id) throw new Error('Create hotel failed');
  const createdId = createData.data.id;

  // Test 7: GET /api/hotels/:id (Detail View)
  console.log(`\n7️⃣ Testing GET /api/hotels/${createdId} (Detail View)...`);
  const detailRes = await fetch(`${BASE_URL}/${createdId}`);
  const detailData = await detailRes.json();
  console.log('   Detail Title:', detailData.data.title, 'Coordinates:', detailData.data.latitude, detailData.data.longitude);
  if (!detailData.success || detailData.data.title !== 'The Grand Royal Palace & Spa') {
    throw new Error('Get detail failed');
  }

  // Test 8: PUT /api/hotels/:id (Edit Hotel)
  console.log(`\n8️⃣ Testing PUT /api/hotels/${createdId} (Update Price & Title)...`);
  const updateForm = new FormData();
  updateForm.append('title', 'The Grand Royal Palace & Spa (Updated)');
  updateForm.append('price', '550.00');
  updateForm.append('description', 'Updated luxury details with newly expanded presidential villas.');
  updateForm.append('latitude', '25.1972');
  updateForm.append('longitude', '55.2744');
  updateForm.append('address', 'Downtown Boulevard Suite 1, Dubai, UAE');

  const updateRes = await fetch(`${BASE_URL}/${createdId}`, {
    method: 'PUT',
    body: updateForm,
  });
  const updateData = await updateRes.json();
  console.log('   Update status:', updateRes.status, 'New Price:', updateData.data.price, 'New Title:', updateData.data.title);
  if (updateRes.status !== 200 || parseFloat(updateData.data.price) !== 550) {
    throw new Error('Update hotel failed');
  }

  // Test 9: DELETE /api/hotels/:id
  console.log(`\n9️⃣ Testing DELETE /api/hotels/${createdId}...`);
  const deleteRes = await fetch(`${BASE_URL}/${createdId}`, {
    method: 'DELETE',
  });
  const deleteData = await deleteRes.json();
  console.log('   Delete status:', deleteRes.status, 'Message:', deleteData.message);
  if (deleteRes.status !== 200 || !deleteData.success) throw new Error('Delete failed');

  // Verify deletion from database
  const verifyDeleteRes = await fetch(`${BASE_URL}/${createdId}`);
  console.log('   Verification query status after delete:', verifyDeleteRes.status);
  if (verifyDeleteRes.status !== 404) throw new Error('Hotel was not deleted from database');

  // ========================================================
  // SPECIAL OFFERS VERIFICATION TESTS
  // ========================================================
  console.log('\n====================================================');
  console.log('🔥 TESTING SPECIAL OFFERS ENDPOINTS & CRUD');
  console.log('====================================================\n');

  // Test 10: GET /api/hotels/offers/featured
  console.log('🔟 Testing GET /api/hotels/offers/featured (Featured Deals Endpoint)...');
  const featRes = await fetch(`${BASE_URL}/offers/featured`);
  const featData = await featRes.json();
  console.log('   Featured offers count:', featData.data?.length);
  console.log('   Deals list:', featData.data?.map(h => `${h.title} -> ${h.offer_badge} [${h.offer_code}]`));
  if (!featData.success || !Array.isArray(featData.data) || featData.data.length === 0) {
    throw new Error('Featured offers endpoint failed');
  }
  for (const item of featData.data) {
    if (!item.has_special_offer) throw new Error('Non-offer item found in featured offers');
  }

  // Test 11: GET /api/hotels?offersOnly=true
  console.log('\n1️⃣1️⃣ Testing GET /api/hotels?offersOnly=true (Special Offers Filter)...');
  const offersFilterRes = await fetch(`${BASE_URL}?offersOnly=true`);
  const offersFilterData = await offersFilterRes.json();
  console.log('   Offers filtered count:', offersFilterData.data?.length, 'Total offers:', offersFilterData.pagination?.totalOffers);
  if (!offersFilterData.success || offersFilterData.data.some(h => !h.has_special_offer)) {
    throw new Error('Special offers filter returned non-special-offer hotels');
  }

  // Test 12: Create a Hotel with Special Offer attached
  console.log('\n1️⃣2️⃣ Testing POST /api/hotels with Special Offer Package...');
  const offerFormData = new FormData();
  offerFormData.append('image', blob, 'special-offer-hotel.jpg');
  offerFormData.append('title', 'Monte Carlo Azure Marina Villa');
  offerFormData.append('description', 'Palatial Mediterranean waterfront villa overlooking private yacht harbors, private chef dining, and yacht excursions.');
  offerFormData.append('latitude', '43.7384');
  offerFormData.append('longitude', '7.4246');
  offerFormData.append('price', '600.00');
  offerFormData.append('address', 'Quai Albert 1er, Monte Carlo, Monaco');
  offerFormData.append('has_special_offer', 'true');
  offerFormData.append('offer_title', 'Riviera Escape 25% OFF & Yacht Tour');
  offerFormData.append('offer_discount_percent', '25');
  offerFormData.append('offer_badge', 'VIP Riviera • 25% OFF');
  offerFormData.append('offer_code', 'MONACO25');
  offerFormData.append('offer_valid_until', 'Summer Special');
  offerFormData.append('offer_description', 'Includes 25% off private villa suites, sunset champagne yacht cruise, and airport limousine transfer.');

  const createOfferRes = await fetch(BASE_URL, {
    method: 'POST',
    body: offerFormData,
  });
  const createOfferData = await createOfferRes.json();
  console.log('   Create offer status:', createOfferRes.status, 'Hotel ID:', createOfferData.data?.id);
  console.log('   Offer title:', createOfferData.data?.offer_title, 'Promo code:', createOfferData.data?.offer_code);
  if (
    createOfferRes.status !== 201 ||
    !createOfferData.data?.has_special_offer ||
    createOfferData.data?.offer_code !== 'MONACO25' ||
    createOfferData.data?.offer_discount_percent !== 25
  ) {
    throw new Error('Create hotel with special offer failed');
  }
  const offerHotelId = createOfferData.data.id;

  // Test 13: Query created hotel detail and verify special offer fields
  console.log(`\n1️⃣3️⃣ Testing GET /api/hotels/${offerHotelId} (Verify Special Offer Details)...`);
  const verifyOfferDetailRes = await fetch(`${BASE_URL}/${offerHotelId}`);
  const verifyOfferDetailData = await verifyOfferDetailRes.json();
  const hotelOffer = verifyOfferDetailData.data;
  console.log('   Detail Offer:', hotelOffer.offer_title, 'Discount:', `${hotelOffer.offer_discount_percent}%`, 'Code:', hotelOffer.offer_code);
  const basePrice = parseFloat(hotelOffer.price);
  const discountPct = hotelOffer.offer_discount_percent;
  const expectedDiscountedPrice = (basePrice * (1 - discountPct / 100)).toFixed(2);
  console.log(`   Base: $${basePrice.toFixed(2)} | Discounted: $${expectedDiscountedPrice} (Savings: $${(basePrice - expectedDiscountedPrice).toFixed(2)})`);
  if (hotelOffer.offer_code !== 'MONACO25' || expectedDiscountedPrice !== '450.00') {
    throw new Error('Special offer calculation or verification failed');
  }

  // Test 14: Update special offer (change discount to 30% and code to MONACO30)
  console.log(`\n1️⃣4️⃣ Testing PUT /api/hotels/${offerHotelId} (Update Special Offer Details)...`);
  const updateOfferForm = new FormData();
  updateOfferForm.append('title', 'Monte Carlo Azure Marina Villa');
  updateOfferForm.append('price', '600.00');
  updateOfferForm.append('has_special_offer', 'true');
  updateOfferForm.append('offer_title', 'Riviera Escape 30% OFF Flash Deal');
  updateOfferForm.append('offer_discount_percent', '30');
  updateOfferForm.append('offer_badge', 'Flash Deal • 30% OFF');
  updateOfferForm.append('offer_code', 'MONACO30');

  const updateOfferRes = await fetch(`${BASE_URL}/${offerHotelId}`, {
    method: 'PUT',
    body: updateOfferForm,
  });
  const updateOfferData = await updateOfferRes.json();
  console.log('   Update status:', updateOfferRes.status, 'New discount:', `${updateOfferData.data?.offer_discount_percent}%`, 'New Code:', updateOfferData.data?.offer_code);
  if (updateOfferRes.status !== 200 || updateOfferData.data?.offer_discount_percent !== 30 || updateOfferData.data?.offer_code !== 'MONACO30') {
    throw new Error('Update special offer failed');
  }

  // Clean up test special offer hotel
  console.log(`\n1️⃣5️⃣ Cleaning up test special offer hotel ${offerHotelId}...`);
  const cleanupRes = await fetch(`${BASE_URL}/${offerHotelId}`, { method: 'DELETE' });
  console.log('   Cleanup status:', cleanupRes.status);
  if (cleanupRes.status !== 200) throw new Error('Cleanup failed');

  console.log('\n====================================================');
  console.log('✅ ALL 15 API, CRUD & SPECIAL OFFERS TESTS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
