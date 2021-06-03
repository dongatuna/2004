const router = require('express-promise-router')()
const AdminController = require('../controllers/admin')
const StudentController = require('../controllers/student')
const authenticate = require("../helpers/authenticate")

//get view for adding many courses
router.route('/courses')
      .get( authenticate.isAdmin,  AdminController.addCourseView )
 //get view prospects
router.route('/prospects')
.get( authenticate.isAdmin,  AdminController.getProspects )     

//get view for course schedules for admin to add or transfer student 
router.route('/course-schedules/:type')
      .get( authenticate.isAdmin,  AdminController.getCourseSchedules )

//route for getting admin dashboard
router.route("/dashboard")
      .get( authenticate.isAdmin, StudentController.getDailyRegistrants )

//get the form for admin to sign up student
router.route("/student_register/:name/:course_id")
      .get( authenticate.isAdmin,  AdminController.getStudentRegisterForm )
      
//get the form for admin to update student
router.route("/update/:name/:course_id/:student_id")
      .get( authenticate.isAdmin,  AdminController.getStudentUpdateForm )
      
//get the page for course registrant to to start job search
router.route('/start-job-search')
      .get( authenticate.isAdmin, AdminController.getJobs)

//get the page for course registrant to to start job search
router.route('/start-job-search')
      .patch( authenticate.isAdmin, AdminController.contactEmployers )

module.exports = router
