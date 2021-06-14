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
router.get('https://www.doh.wa.gov/Portals/1/Documents/Pubs/667032.pdf', SiteController.getReceiptPage )
//gets page for student to pay registration fee after receiving email //    getStudentPayRegistrationForm
router.get('/secure/:code/:course_id/:student_id', SiteController.getStudentPayRegistrationForm )

/**
 * TREATMENT GROUP: Path ('b') after google ads
 * Course landing page form (for prospect)
 * Course schedules
 * [SHORT] Course payment or course add to waitlist form - form with one field
 * 
*/
//**************************************************************************************** */
//get the courses landing page
//------router.get('/select/:name', SiteController.getCourseLandingForm )
router.get('/course/:name', SiteController.getCourseLandingForm )
//get the course schedules
router.get('/dates/:course', SiteController.getCourseDates )
//gets page for student to pay registration fee after receiving email /
router.get('/select-payment/:code/:course_id', SiteController.getStudentPayment )

//***************************************************************************************** */

/**
 * CONTROL GROUP: Path ('a') after google ads
 * Course landing page - has a button only and NO form
 * Course schedules 
 * [LONG] Course payment or add to waitlist form - form with 5 fields
 */

//***************************************************************************************** */
//get the courses landing page
//------router.get('/course/:name', SiteController.getCourseLandingForm )
router.get('/select/:name', SiteController.getCoursesLandingPage )
//get the all courses - single day, multiple day, and reservations - in catalog
router.get('/learn/:course', SiteController.getCatalogCourse )
//get lead page for courses
router.get('/register/:course/:course_id', SiteController.getCourseRegistrationForm )
//get lead page for courses
router.get('/train/:course/:course_id', SiteController.getCourseRegistrationForm)

//***************************************************************************************** */

//gets page for student to pay registration fee after receiving email /
router.get('/enroll/:code/:course_id', SiteController.getStudentPayRegistrationForm )
//receipt page after receipt of payment for course sign up
router.get('/confirm-payment', SiteController.getReceiptPage )

//get lead page for other courses
router.get("/schedules/:name", SiteController.getLeadCourses )


//get regular sign up page
router.get('/signup/:course_id', SiteController.getCourseRegistrationForm )
//get the the videos page
router.get("/videos", SiteController.getVideosPage )

//get the the why post page
router.get("/recruit", SiteController.getJobsMainLandingPage )
//get the hca page
router.get("/page/:course", SiteController.getCourseDetailsPage )
//get the jobs landing page
router.get("/hire", SiteController.getJobsLandingPage )

module.exports = router