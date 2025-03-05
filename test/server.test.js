const request = require('supertest');
const chai = require('chai');
const expect = chai.expect;
const app = require('../server'); // Adjust the path if needed

describe('DineWise Backend API', function() {
    let testRestaurantId;
    let reservationId;
    let queueId;
    let reservationNum;
    let queueNum;

    // Test GET /restaurants
    it('GET /restaurants should return a list of restaurants', function(done) {
        request(app)
            .get('/restaurants')
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('restaurants');
                expect(res.body.restaurants).to.be.an('array');
                if (res.body.restaurants.length > 0) {
                    testRestaurantId = res.body.restaurants[0].id;
                }
                done();
            });
    });

    // Test GET /reservations
    it('GET /reservations should return reservations for a restaurant', function(done) {
        request(app)
            .get(`/reservations?restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('reservations');
                expect(res.body.reservations).to.be.an('array');
                reservationNum = res.body.reservations.length;
                done();
            });
    });

    // Test POST /reservations
    it('POST /reservations should create a new reservation', function(done) {
        request(app)
            .post('/reservations')
            .send({
                restaurant_id: testRestaurantId,
                reservation_time: new Date().toISOString(),
                customer_name: "Test Customer",
                phone_number: "1234567890"
            })
            .expect(201)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('reservation_id');
                reservationId = res.body.reservation_id;
                done();
            });
    });

    // Test reservation number after POST /reservations
    it('POST /reservations should exactly add one to the reservation list', function(done) {
        request(app)
            .get(`/reservations?restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.reservations.length).to.equal(reservationNum + 1);
                done();
            });
    });

    // Test DELETE /reservations/:id
    it('DELETE /reservations/:id should delete a reservation', function(done) {
        request(app)
            .delete(`/reservations/${reservationId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('success', true);
                done();
            });
    });

    // Test reservation number after DELETE /reservations/:id
    it('DELETE /reservations/:id should exactly delete one to the reservation list', function(done) {
        request(app)
            .get(`/reservations?restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.reservations.length).to.equal(reservationNum);
                done();
            });
    });

    // Test GET /queue
    it('GET /queue should return the queue for a restaurant', function(done) {
        request(app)
            .get(`/queue?restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('queue');
                expect(res.body.queue).to.be.an('array');
                queueNum = res.body.queue.length;
                done();
            });
    });

    // Test POST /queue
    it('POST /queue should allow a customer to join the queue', function(done) {
        request(app)
            .post('/queue')
            .send({
                restaurant_id: testRestaurantId,
                customer_name: "Queue Tester",
                phone_number: "0987654321"
            })
            .expect(201)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('queue_id');
                expect(res.body).to.have.property('position');
                queueId = res.body.queue_id;
                done();
            });
    });

    // Test queue number after POST /queue
    it('POST /queue should add one to queue list exactly', function(done) {
        request(app)
            .get(`/queue?restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.queue.length).to.equal(queueNum + 1);
                done();
            });
    });

    // Test GET /queue/status
    it('GET /queue/status should return the correct queue position', function(done) {
        request(app)
            .get(`/queue/status?customer_name=Queue+Tester&phone_number=0987654321&restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('position');
                done();
            });
    });

    // Test DELETE /queue/:id
    it('DELETE /queue/:id should remove a queue entry', function(done) {
        request(app)
            .delete(`/queue/${queueId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body).to.have.property('success', true);
                done();
            });
    });

    // Test queue number after DELETE /queue/:id
    it('DELETE /queue/:id should delete exactly one to queue list', function(done) {
        request(app)
            .get(`/queue?restaurant_id=${testRestaurantId}`)
            .expect(200)
            .end((err, res) => {
                if (err) return done(err);
                expect(res.body.queue.length).to.equal(queueNum);
                done();
            });
    });
});


