const express = require('express')
const router = require("express-promise-router")()
const CourseController = require('../controllers/course')
const SiteController = require('../controllers/site')

//get home page
router.get('/',  SiteController.getHomePage )
//get the admin sign in page
router.get("/admin/signin",  SiteController.getAdminSignInPage )
//get the admin sign up page
router.get("/admin/signup", SiteController.getAdminSignUpPage )
//get the page for course registrant to apply
router.get('/start-job-search', SiteController.getJobs )
//get the lead main course page
router.get('/courses', SiteController.getMainCourseLandingPage )
//get the catalog page
router.get('/classes', SiteController.getMainClassLandingPage )
//get courses for the general site page
router.get('/catalog', SiteController.getCatalog )
//get the questions page
router.get("/questions", SiteController.getQuestionsPage )
//receipt page after waitlisting for a course 
router.get('/success', SiteController.getReceiptPage )
//gets page for student to pay registration fee after receiving email //    getStudentPayRegistrationForm
router.get('/secure/:code/:course_id/:student_id', SiteController.getStudentPayRegistrationForm )

//************************************************************************************* */
//routes for experimenting
//get the courses landing page
router.get('/select-course/:name', SiteController.getCoursesLandingPage )
//get the course schedules
router.get('/select-schedule/:course', SiteController.getCatalogCourse  )
//gets page for student to pay registration fee after receiving email /
router.get('/select-payment/:code/:course_id', SiteController.getStudentPayment )

//************************************************************************************ */
//gets page for student to pay registration fee after receiving email /
router.get('/enroll/:code/:course_id', SiteController.getStudentPayRegistrationForm )
//receipt page after receipt of payment for course sign up
router.get('/confirm-payment', SiteController.getReceiptPage )
//get the courses landing page
router.get('/course/:name', SiteController.getCoursesLandingPage )
//get lead page for other courses
router.get("/schedules/:name", SiteController.getLeadCourses )
//get lead page for courses
router.get('/register/:course/:course_id', SiteController.getCourseRegistrationForm )
//get lead page for courses
router.get('/train/:course/:course_id', SiteController.getCourseRegistrationForm )
//get regular sign up page
router.get('/signup/:course_id', SiteController.getCourseRegistrationForm )
//get the the videos page
router.get("/videos", SiteController.getVideosPage )
//get the all courses - single day, multiple day, and reservations - in catalog
router.get('/learn/:course', SiteController.getCatalogCourse )
//get the the why post page
router.get("/recruit", SiteController.getJobsMainLandingPage )
//get the hca page
router.get("/page/:course", SiteController.getCourseDetailsPage )
//get the jobs landing page
router.get("/hire", SiteController.getJobsLandingPage )

module.exports = router