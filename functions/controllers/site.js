const QuestionService = require('../client_helpers/QuestionService')
const SkillService = require('../client_helpers/SkillService')
const seo_page = require('../client_helpers/seo_page_info')
const { registration_fee } = require('../client_helpers/courses.js')
const moment = require('moment-timezone')
const { course_classifier, courseDbName  } = require('../helpers/course_classifier')
const { campaign, courseName, courseCampaigns } = require('../client_helpers/campaign') 
const { catalog, courseCode, upsell }  = require('../client_helpers/catalog') 
const firebase = require("firebase")
//const { getJobPostForm, getJobPreview } = require('./job')
const db = firebase.firestore()


module.exports = {

    //1. Get the home page
    getHomePage: (req, res) => {
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
        res.render('site/home', { seo_info: seo_page.home_page_seo_info })
    },

    //2. Get why post page
    getWhyPostPage: (req, res) => {
        res.render('site/whypost',  { seo_info: seo_page.whypost_page_seo_info })
    },

    //3. Get the questions page
    getQuestionsPage: (req, res) => {
        //construct quiz using 10 questions
        const quiz = new QuestionService(10)
        //randomize the questions
        quiz.randomizeQuestions()
    
        const questions = quiz.questions  
       
        const answerChoices = ['A', 'B', 'C', 'D']
       
        res.render('site/questions', { seo_info: seo_page.questions_page_seo_info, questions, answerChoices })                             
                                    
    },

    //4. Get the employer sign in page
    getSignInPage: (req, res) => {
        res.render('site/signin', { seo_info: seo_page.signin_page_seo_info })
    },

    //5. Get the employer sign up page
    getSignUpPage: (req, res) => {
        const campaignText = campaign.campaignText.recruit
        // const campaignText = campaignText["recruit"]["header"]
        res.render('site/leadsignup', { campaignText: campaignText, seo_info: seo_page.signup_page_seo_info })    
        //res.status(200).json({campaignText})
    },    

    //7. Get the course registration form
    getCourseRegistrationForm: async (req, res) => {    
        //get the course id
        const { course_id, course } = req.params  
        //get the long name of course stored in database
        const course_name = courseName(course)           
        //get course registration fee
        const fees  = registration_fee[course_name]
        console.log('COURSE NAME', course_name, "and fees ", fees)
        const lead = course != undefined ? true : false

        try {       

            if(
                course_name == "BLS Course Skill Testing" || 
                course_name == "Adult CPR/First Aid/AED Skill Testing" || 
                course_name == "DSHS Nurse Delegation Special Focus on Diabetes" || 
                course_name == "DSHS Nurse Delegation (CORE) for NAs and HCAs" 
            ){
              
                const title = `${ course_name } Sign Up Form`

                const data = {
                    courseId: course_id,
                    fees,
                    title,
                    name: course_name
                }

                res.render('site/a/studentsignup',// 'site/enrollstudent', 
                    {   
                        // csrfToken: req.csrfToken(),
                        code: course,
                        seo_info: seo_page.register_page_seo_info, 
                        lead: lead,
                        course: data,                                
                        STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY
                    }
                )

            } else {
                //find the course
                const query = await db.collection('courses').doc(course_id).get()
                //construct data about class - remove student array
                const results = query.data()
                
                const title = results.end_date !== null ? moment( results.start_date.toDate()).tz('America/Los_Angeles' ).format("MMM D") +" - "+ moment( results.end_date.toDate()).tz('America/Los_Angeles' ).format("MMM D") +" "+ results.name + " " + results.type : moment( results.start_date.toDate()).tz('America/Los_Angeles' ).format("MMM D") +" "+ results.name + " " + results.type +" Sign Up Form"     
                
                const data = {              
                    courseId: course_id,                                               
                    title,
                    fees,
                    name: course_name                  
                } 
                
               
                res.render('site/a/studentsignup',// 'site/enrollstudent', 
                    {   
                        // csrfToken: req.csrfToken(),
                        code: course,
                        seo_info: seo_page.register_page_seo_info, 
                        lead: lead,
                        course: data,                                
                        STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY
                    }
                )
            }      
            
        } catch (error) {
            console.log(error)
            // throw error(error)
        }      
    },
    /**
     * View registration payment field and add student
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    getStudentPayment: async ( req, res, next ) => {
        //get the params in the url
        const { code, course_id } = req.params
        //get the long name of course stored in database
        const course_name = courseName(code)
        //remove the links in the nav bar - lead page = true
        const lead = true
        //get course registration fee
        const fees  = registration_fee[course_name]
        if(
            course_name == "BLS Course Skill Testing" || 
            course_name == "Adult CPR/First Aid/AED Skill Testing" || 
            course_name == "DSHS Nurse Delegation Special Focus on Diabetes" || 
            course_name == "DSHS Nurse Delegation (CORE) for NAs and HCAs" 
        ){
          
            const title = `${ course_name } Sign Up Form`

            const data = {
                courseId: course_id,
                fees,
                title,
                name: course_name
            }

            return res.render('site/b/enrollstudent', 
                {   
                    // csrfToken: req.csrfToken(),
                    code: course,
                    seo_info: seo_page.register_page_seo_info, 
                    lead: lead,
                    course: data,                                
                    STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY
                }
            )
        }
        try {
             //else {
                //find the course
                const query = await db.collection('courses').doc(course_id).get()
                //construct data about class - remove student array
                const results = query.data()                
                
                const title = results.end_date !== null ? moment( results.start_date.toDate()).tz('America/Los_Angeles' ).format("MMM D") +" - "+ moment( results.end_date.toDate()).tz('America/Los_Angeles' ).format("MMM D") +" "+ results.name + " " + results.type : moment( results.start_date.toDate()).tz('America/Los_Angeles' ).format("MMM D") +" "+ results.name + " " + results.type +" Sign Up Form"     
                
                const data = {              
                    courseId: course_id,                                               
                    title,
                    fees,
                    name: course_name                  
                }  
                
                console.log(`Data: ${JSON.stringify(data)}`)
               
                res.render('site/b/enrollstudent', 
                    {   
                        // csrfToken: req.csrfToken(),
                        code: code,
                        seo_info: seo_page.register_page_seo_info, 
                        lead: lead,
                        course: data,                                
                        STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY
                    }
                )
            //} 

            
            
        } catch (error) {
            console.log('Error ', error)
        }
    },

    /** 
     * The link to this form is sent to student who has already registered for a class
     * Aims to get the student to sign up and convert from waitlist to registered    
     * @param {code, course_id, student_id} req //course
     * @param {full name of student, email, tel, id } res 
     * @param {none} next 
     */
    getStudentPayRegistrationForm : async ( req, res, next ) => {
        //get the parameters
        const { code, course_id, student_id } = req.params   
        //get the course or reservation full name/title
        const course = await courseDbName( code, course_id )   
        //get the long name of course stored in database
            
        console.log( 'and course ', course)       
        //get course registration fee
        const fees  = registration_fee[course.data.name]

        try {
            //get the student using student id
            const result = await db.collection('students').doc(student_id).get()
            //create student to return to the front side
            const student = {
                name: `${ result.data().first } ${ result.data().last }`,
                email: `${ result.data().email } `,
                phone: `${ result.data().tel }`,
                id: result.id
            }
            //return the registration form
            res.render('site/enrollstudent', {                
                course: course,                
                code: code,  
                fees: fees,
                student: student,                 
                seo_info: seo_page[code + "_page_seo_info"] ,
                seo_info: seo_page.register_page_seo_info, 
                STRIPE_PUBLIC_KEY: STRIPE_PUBLIC_KEY                                            
            })      
                
            
        } catch (error) {
            console.log( 'error', error )
        }
    },
    //8. Get the receipt page
    getReceiptPage: (req, res) => {
      
        res.render('site/success', { seo_info: seo_page.payment_page_seo_info })
    },
    
    //9. Get the videos page
    getVideosPage: (req, res) => {
        
        const skill_videos = new SkillService()
    
        skill_videos.randomizeSkills()
    
        const cna_videos = skill_videos.allVideos//.slice(0,8)
    
        var videos = []
        var chunkSize = 3
        for (var i = 0; i < cna_videos.length; i += chunkSize) {
            videos.push(cna_videos.slice(i, i + chunkSize))
        }
    
        res.render('site/videos', {videos: videos, seo_info: seo_page.videos_page_seo_info})
        //res.status(200).json({videos})
    },

    //10. Get the employer sign in page
    getAdminSignInPage: (req, res) => {
        // res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
        res.render('site/adminsignin', {
                                            // csrfToken: req.csrfToken(),
                                            seo_info: seo_page.admin_signin_page_seo_info 
                                        })
    },

    //get 10 jobs to present to a course registrant
    getJobs: async ( req, res, next ) => {
        console.log('shiiieeet')
        try {
            //get 10 most recent jobs
            const results = await db.collection("jobs")
                                    .orderBy("created", "desc")
                                    .limit(10)
                                    .get()

            const jobs = results.docs.map( x => {
                                    return {                                        
                                        id: x.id,
                                        address: x.data().address,
                                        email: x.data().email,                                   
                                        facility_name: x.data().facility_name,
                                        title: x.data().title,
                                    }
                                })
            console.log('JOBS ', jobs)
            //
            res.render('site/applyjob', { jobs: jobs, seo_info: seo_page.jobs_page_seo_info })                      
            

        } catch (error) {
            
        }
    },
    //11. Get the employer sign up page
    getAdminSignUpPage: (req, res) => {
        res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
        const campaignText = campaign.campaignText.recruit
       // const campaignText = campaignText["recruit"]["header"]
        res.render('site/adminsignup', 
                                    { 
                                        // csrfToken: req.csrfToken(),
                                        campaignText: campaignText, 
                                        seo_info: seo_page.admin_signup_page_seo_info 
                                    })    
        //res.status(200).json({campaignText})
    },       
    //12. Get CNA lead course schedule page
    getLeadCourses: async ( req, res ) => {    
            //get start of today
        const today = moment().startOf('day')
        //get the long name of course stored in database
        const course_name = courseName(req.params.name)

        try{   

            if (
                course_name == "BLS Course Skill Testing" || 
                course_name == "Adult CPR/First Aid/AED Skill Testing" || 
                course_name == "DSHS Nurse Delegation (CORE) for NAs and HCAs" || 
                course_name == "DSHS Nurse Delegation Special Focus on Diabetes" 
            ){
                //get courses by name 
                const results = await db.collection('reservations') 
                                        .where('name','==', course_name )                     
                                        .get()  

                const course = results.docs.map( x => { 
                    return { data: x.data(), id: x.id } 
                })

                console.log( 'reservations ', course)
                //return course
                res.render('site/leadcourseschedules', {
                    course: course[0].data,
                    name: course[0].data.name,
                    course_id: course[0].id,
                    code: req.params.name,
                    seo_info: seo_page[req.params.name + "_page_seo_info"]   
                })
            
            } else {
                 //get courses by name 
                const results = await db.collection('courses') 
                                        .where( 'name','==',`${ course_name }` )                                       
                                        .orderBy('start_date')   
                                        .get()  

                //get documents
                const docs = results.docs

                //sort the docs to get classes starting today or later
                const classes = docs.filter( doc => moment( doc.data().start_date.toDate() ).isSameOrAfter(today) && doc.data().name === `${course_name}` )
                                    .map( doc => {                                    
                                        return{                            
                                            'end_date': doc.data().end_date ? moment(doc.data().end_date.toDate()).format("MMM DD") : null, 
                                            'name': doc.data().name,                            
                                            'start_date': moment(doc.data().start_date.toDate()).format("MMM DD"),
                                            'type': doc.data().type,
                                            'id': doc.id
                                        }                        
                                    }) 

                //classify the courses as either day, evening, weekend
                const courses = course_classifier( classes )                
 
                if( classes.length > 0 ){
                    res.locals.lead = true
                    res.render('site/leadcourseschedules', {                
                        course: courses[req.params.name],
                        name: course_name,
                        code: req.params.name,                   
                        seo_info: seo_page[req.params.name + "_page_seo_info"]                                              
                    })
                } else {
                    res.status(404).json({
                        message: `No ${course_name} courses at the moment.  Check with us later.`
                    })                   
                }
            }
           
        }catch(err){
            console.log(err)
            res.status(500).json({
                message: `There has been an error getting the courses.`,
                err
            })
        }  
    }, 
    //not finished
    getCourses: async ( req, res, next) => { 
        try {

            res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
            const today = moment().startOf('day').toDate()            

            const results = await db.collection('courses')                                        
                                    .orderBy('start_date')   
                                    .get()  

            const docs = results.docs

            const classes = docs.filter(doc => moment( doc.data().start_date.toDate() ).isSameOrAfter(moment(today)) )
                                .map(x=> {
                                    start = x.data().start_date.toDate()
                                    end = x.data().end_date ? x.data().end_date.toDate() : null
                                
                                    return{                            
                                        'end_date': end ? moment(end).format("MMM DD") : null, 
                                        'name': x.data().name,                            
                                        'start_date': moment(start).format("MMM DD"),
                                        'type': x.data().type,
                                        'id': x.id
                                    }                        
                                })  

           
            if(classes.length > 0 ) {
                //res.status(201).json({message: "Future public courses", courses: course_classifier(classes) })
                res.render('site/schedule', {
                    classes:  course_classifier(classes),
                    choices: [
                        "Certified Nurse Assistant/CNA",
                        "DSHS Home Care Aide/75 Hours",                        
                        "HCA to CNA Bridging",                        
                        "DSHS 12 Hours Continuous Education Units", 
                        "DSHS Dementia Specialty", 
                        "DSHS Mental Health Specialty", 
                       // "DSHS Safety and Orientation",
                        "BLS Course Skill Testing", 
                        "Adult CPR/First Aid/AED Course Skill Testing",
                        "DSHS Nurse Delegation (CORE) for NAs and HCAs",
                        "DSHS Nurse Delegation Special Focus on Diabetes" 
                    ],                                       
                    seo_info: seo_page.schedule_page_seo_info                                         
                })
            }          
        } catch (error) {
            console.log(error)
        }
    },
    //get course catalog page
    getCatalog: ( req, res, next ) => {
        const itemList = catalog.map(x => {
            return {
                "@type": "ListItem",
                "position": catalog.indexOf(x) + 1,
                "item": {
                        "url": x.url,
                        "name": x.name,
                        "@id": x.url,
                        "type": "Course",
                        "description": x.description,
                        "provider":"Excel Health Careers Training"
                    }
            }
        })

        //res.send(itemList)
        res.render('site/catalog', { courses: catalog, itemList: itemList, seo_info: seo_page.catalog_page_seo_info })
    },
    //get course details page
    getCourseDetailsPage: ( req, res, next  ) => {
        //get the req param and use it to return the course
        const course = courseCode.indexOf(req.params.course)

        res.render('site/course_details', { 
                                        code: req.params.course, 
                                        course: catalog[course], 
                                        seo_info: seo_page[req.params.course + "_page_seo_info"]
                                    } )
    },//
    getCourseDates : async ( req, res, next ) =>{
        try {             
              //get the long name of course stored in database
              const course_name = courseName(req.params.course)

              console.log('course name ', course_name)

              if(
                    course_name == "BLS Course Skill Testing" || 
                    course_name == "Adult CPR/First Aid/AED Course Skill Testing" || 
                    course_name == "DSHS Nurse Delegation (CORE) for NAs and HCAs" || 
                    course_name == "DSHS Nurse Delegation Special Focus on Diabetes" 
                ){
                    //get courses by name 
                    const results = await db.collection('reservations') 
                                            .where('name','==', course_name )                     
                                            .get()  
                    
                    const course = results.docs.map( x => {                        
                       return { data: x.data(), id: x.id } 
                    } )

                    console.log( 'reservations ', course)
                    //return course
                    res.render('site/b/leadcourseschedules', {
                        course: course[0].data,
                        name: course[0].data.name,
                        course_id: course[0].id,
                        code: req.params.course,
                        seo_info: seo_page[req.params.course + "_page_seo_info"]   
                    })

              } else {

                    //get start of today
                    const today = moment().startOf('day')

                    //get courses by name 
                    const results = await db.collection('courses') 
                                            .where('name','==', `${course_name}`)                                       
                                            .orderBy('start_date')   
                                            .get()  

                    //get documents
                    const docs = results.docs

                    //sort the docs to get classes starting today or later
                    const classes = docs.filter( doc => moment( doc.data().start_date.toDate() ).isSameOrAfter(today) && doc.data().name ==  course_name )
                                        .map( doc => {                                    
                                            return {                            
                                                'end_date' : doc.data().end_date ? moment(doc.data().end_date.toDate()).format("MMM DD") : null, 
                                                'name': doc.data().name,                            
                                                'start_date': moment(doc.data().start_date.toDate()).format("MMM DD"),
                                                'type': doc.data().type,
                                                'id': doc.id
                                            }                        
                                        }) 
                                        
                    //classify the courses as either day, evening, weekend
                    const courses = course_classifier( classes )

                    //return classes, seo information and campaign information
                    console.log('classes -> ', courses[req.params.course])
                    if( classes.length > 0 ){
                        res.locals.lead = true
                        res.render('site/b/leadcourseschedules', {
                            //res.status(201).json({
                            course: courses[req.params.course],
                            name: course_name,       
                            code: req.params.course,                
                            seo_info: seo_page[req.params.course + "_page_seo_info"]                                              
                        })

                    } else {
                        res.status(404).json({
                            message: `No ${course_name} courses at the moment.  Check with us later.`
                        })                   
                    }  

              }                       
            
        } catch (err) {
            console.log(err)
            res.status(500).json({
                message: `There has been an error getting the courses.`,
                err
            })
        }
    },  

    //
    getCatalogCourse : async ( req, res, next ) =>{
        try {             
              //get the long name of course stored in database
              const course_name = courseName(req.params.course)

              console.log('course name ', course_name)

              if(
                    course_name == "BLS Course Skill Testing" || 
                    course_name == "Adult CPR/First Aid/AED Course Skill Testing" || 
                    course_name == "DSHS Nurse Delegation (CORE) for NAs and HCAs" || 
                    course_name == "DSHS Nurse Delegation Special Focus on Diabetes" 
                ){
                    //get courses by name 
                    const results = await db.collection('reservations') 
                                            .where('name','==', course_name )                     
                                            .get()  
                    
                    const course = results.docs.map( x => {                        
                       return { data: x.data(), id: x.id } 
                    } )

                    console.log( 'reservations ', course)
                    //return course
                    res.render('site/a/courseschedules', {
                        course: course[0].data,
                        name: course[0].data.name,
                        course_id: course[0].id,
                        code: req.params.course,
                        seo_info: seo_page[req.params.course + "_page_seo_info"]   
                    })

              } else {

                    //get start of today
                    const today = moment().startOf('day')

                    //get courses by name 
                    const results = await db.collection('courses') 
                                            .where('name','==', `${course_name}`)                                       
                                            .orderBy('start_date')   
                                            .get()  

                    //get documents
                    const docs = results.docs

                    //sort the docs to get classes starting today or later
                    const classes = docs.filter( doc => moment( doc.data().start_date.toDate() ).isSameOrAfter(today) && doc.data().name ==  course_name )
                                        .map( doc => {                                    
                                            return {                            
                                                'end_date' : doc.data().end_date ? moment(doc.data().end_date.toDate()).format("MMM DD") : null, 
                                                'name': doc.data().name,                            
                                                'start_date': moment(doc.data().start_date.toDate()).format("MMM DD"),
                                                'type': doc.data().type,
                                                'id': doc.id
                                            }                        
                                        }) 
                                        
                    //classify the courses as either day, evening, weekend
                    const courses = course_classifier( classes )

                    //return classes, seo information and campaign information
                    console.log('classes -> ', courses[req.params.course])
                    if( classes.length > 0 ){
                        res.locals.lead = true
                        res.render('site/a/courseschedules', {
                            //res.status(201).json({
                            course: courses[req.params.course],
                            name: course_name,       
                            code: req.params.course,                
                            seo_info: seo_page[req.params.course + "_page_seo_info"]                                              
                        })

                    } else {
                        res.status(404).json({
                            message: `No ${course_name} courses at the moment.  Check with us later.`
                        })                   
                    }  

              }                       
            
        } catch (err) {
            console.log(err)
            res.status(500).json({
                message: `There has been an error getting the courses.`,
                err
            })
        }
    },    
    //get general course landing page
    getMainCourseLandingPage: ( req, res ) => { 
        try {
            //set res locals to true
            res.locals.lead = true
            //send back the view
            res.render('site/courseslanding', {
                seo_info : seo_page.courses_landing_seo_info 
            } )
        } catch ( err ) {
            console.log("Error getting main course page", err)
        }
    },
    //get general course landing page
    getMainClassLandingPage: ( req, res ) => { 
        try {
            //send back the view
            res.render('site/courseslanding', {
                seo_info : seo_page.courses_landing_seo_info 
            } )
        } catch ( err ) {
            console.log("Error getting main course page", err)
        }
    },
    // Get courses landing page for CNA, HCA/Core Basic, HCA to NAC bridging
    getCourseLandingForm: (req, res) => {
        try {
            //get course name from the req.params
            const course = req.params.name == 'hca' || req.params.name == 'cna' ? req.params.name.toUpperCase() : "HCA - CNA Bridging"

            console.log('course ', course, 'campaign text ', courseCampaigns[course] )
            res.locals.lead = true
            //return course landing view, seo information and text
            res.render('site/b/leadcourseform',  { 
                        code: req.params.name,
                        course : course,
                        seo_info : seo_page.courses_landing_seo_info,  
                        text : courseCampaigns[course]
                    })   
        } catch (error) {
            console.log('error', error)
        }
        
    },

     // Get courses landing page for CNA, HCA/Core Basic, HCA to NAC bridging
    getCoursesLandingPage: (req, res) => {
        try {
            //get course name from the req.params
            const course = req.params.name == 'hca' || req.params.name == 'cna' ? req.params.name.toUpperCase() : "HCA - CNA Bridging"

            console.log('course ', course, 'campaign text ', courseCampaigns[course] )
            res.locals.lead = true
            //return course landing view, seo information and text
            res.render('site/a/leadcourseslanding',  { 
                        code: req.params.name,
                        course : course,
                        seo_info : seo_page.courses_landing_seo_info,  
                        text : courseCampaigns[course]
                    })   
        } catch (error) {
            console.log('error', error)
        }
        
    },
    // Get jobs landing page
    getJobsLandingPage: (req, res) => {
        res.locals.lead = true

        res.render('site/jobslanding',  { seo_info: seo_page.jobs_landing_seo_info })
    },
    // Get jobs landing page
    getJobsMainLandingPage: (req, res) => {
        //get the well designed page for jobs landing       
        res.render('site/jobslanding',  { seo_info: seo_page.jobs_landing_seo_info })
    }
}