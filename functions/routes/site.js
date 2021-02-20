const express = require('express')
const router = require("express-promise-router")()
const CourseController = require('../controllers/course')
const SiteController = require('../controllers/site')

//get home page
router.get('/',  SiteController.getHomePage)
//get the admin sign in page
router.get("/admin/signin",  SiteController.getAdminSignInPage)
//get the admin sign up page
router.get("/admin/signup", SiteController.getAdminSignUpPage)
//get the catalog page
router.get('/catalog', SiteController.getCatalog)
//get courses for the general site page
router.get('/courses', SiteController.getCourses)
//get the questions page
router.get("/questions", SiteController.getQuestionsPage)
//receipt page after waitlisting for a course 
router.get('/success', SiteController.getReceiptPage)
//receipt page after receipt of payment for course sign up
router.get('/confirm-payment', SiteController.getReceiptPage)
//get lead page for other courses
router.get('/course/:name',  SiteController.getLeadCourses)
//get lead page for courses
router.get('/register/:course/:course_id', SiteController.getCourseRegistrationForm)
//get lead page for courses
router.get('/train/:course/:course_id', SiteController.getCourseRegistrationForm)
//get regular sign up page
router.get('/signup/:course_id', SiteController.getCourseRegistrationForm)
//get the the videos page
router.get("/videos", SiteController.getVideosPage)
//get the all courses - single day, multiple day, and reservations - in catalog
router.get('/learn/:course', SiteController.getCatalogCourse)
//get the the why post page
router.get("/whypost", SiteController.getWhyPostPage)
//get the hca page
router.get("/page/:course", SiteController.getCourseDetailsPage )
//get the courses landing page
router.get("/courseslanding", SiteController.getCoursesLandingPage )
//get the jobs landing page
router.get("/jobslanding", SiteController.getJobsLandingPage )

module.exports = router
