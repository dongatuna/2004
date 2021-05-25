const router = require('express-promise-router')()
const studentController = require('../controllers/student')
const authenticate = require("../helpers/authenticate")

//post/processes student payment information
router.route( '/registration' ).post( studentController.studentPayRegistration )
//student registers self for a course on public site
router.route('/register/:code/:id').post( studentController.studentSelfEnrollment )

//student registers self for a course on public site
router.route('/enroll/:code/:id').post( studentController.studentCourseSelfSignUp)
//student contacts employers (starts job search) while enrolling for class
router.route('/start-job-search').patch( studentController.contactEmployers )
//student contacts employers (starts job search) while enrolling for class
router.route('/prospects/:code')
      .post( studentController.registerProspect )
//admin registers a new student
router.route('/start/:code/:course_id').post( authenticate.isAdmin, studentController.studentCourseSignUpByAdmin ) 
//admin updates a student 
router.route('/update/:code/:course_id').patch( authenticate.isAdmin, studentController.studentUpdateByAdmin ) 
//admin transfers a student
router.route('/transfer').patch( authenticate.isAdmin, studentController.transferStudent ) 
//admin unenroll a student
router.route('/unenroll/:student_id/:course_id').get( authenticate.isAdmin, studentController.unenrollStudent ) 
//admin search a student
router.route('/search').post( authenticate.isAdmin, studentController.searchStudent ) 

module.exports = router