const QuestionService = require('../client_helpers/QuestionService')
const SkillService = require('../client_helpers/SkillService')
const seo_page = require('../client_helpers/seo_page_info')
const { registration_fee } = require('../client_helpers/courses.js')
const moment = require('moment-timezone')
const { course_classifier } = require('../helpers/course_classifier')
const { campaign, courseName } = require('../client_helpers/campaign') 
const { catalog, courseCode, upsell }  = require('../client_helpers/catalog') 
const firebase = require("firebase")
const { getJobPostForm, getJobPreview } = require('./job')
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
        try {             
            //get the course id
            const { course_id, course } = req.params  
            //get the long name of course stored in database
            const course_name = courseName(course)           
            //get course registration fee
            const fees  = registration_fee[course_name]
            console.log('COURSE NAME', course_name, "and fees ", fees)
            const lead = course != undefined ? true : false

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

                res.render('site/studentsignup', 
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
                
               
                res.render('site/studentsignup', 
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
      //  res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
        res.render('site/adminsignin', {
                                            // csrfToken: req.csrfToken(),
                                            seo_info: seo_page.admin_signin_page_seo_info 
                                        })
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
        try{                   
            //get start of today
            const today = moment().startOf('day')
            //get the long name of course stored in database
            const course_name = courseName(req.params.name)

            if(
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
                    code: req.params.course,
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
                        code: req.params.course,                   
                        seo_info: seo_page[req.params.name + "_page_seo_info"]                                              
                    })
                }else{
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
                        "DSHS Safety and Orientation"
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

        res.render('site/details/hca', { 
                                        code: req.params.course, 
                                        course: catalog[course], 
                                        seo_info: seo_page[req.params.course + "_page_seo_info"]
                                    } )
    },
    //
    getCatalogCourse : async ( req, res, next ) =>{
        try {             
              //get the long name of course stored in database
              const course_name = courseName(req.params.course)

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
                    res.render('site/leadcourseschedules', {
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
                                                'end_date': doc.data().end_date ? moment(doc.data().end_date.toDate()).format("MMM DD") : null, 
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
                        res.render('site/leadcourseschedules', {
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
    // Get courses landing page
    getCoursesLandingPage: (req, res) => {
        res.render('site/courseslanding',  { seo_info: seo_page.courses_landing_seo_info })
    },
    // Get jobs landing page
    getJobsLandingPage: (req, res) => {
        res.render('site/jobslanding',  { seo_info: seo_page.jobs_landing_seo_info })
    },
}
