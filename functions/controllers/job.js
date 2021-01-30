const firebase = require("firebase")
const moment = require('moment')
//create reference for firestore database
const db = firebase.firestore()
//const crypto = require("crypto")
const seo_page = require('../client_helpers/seo_page_info')
//const fetch = require('node-fetch');
const { stringify } = require('querystring')

module.exports = {

    //read all the jobs and profiles
    allJobs: async(req, res, next)=>{        
        try{             
            //get all the jobs from all users in descending order - recent posts get listed highest
            const allJobs = await db.collection('jobs').orderBy('created').get() //Job.find({}).sort({createdAt: 'desc'})            
            
            const dBjobs = allJobs.docs

            //jobs to be viewed by public
            const jobs = dBjobs.map(x => {
                            return {
                                id : x.id,                              
                                created : x.created,                               
                                title: x.title,
                                //description: x.description                                
                            }                
                        })            
           
            //res.status(200).json({jobs})
            res.render('site/jobs', { jobs: jobs, seo_info: seo_page.jobs_page_seo_info })              

        }catch(error){
            console.log(error)
            // res.status(500).json({
            //     console.log
            //     message:"There has been an error fetching the data",
            //     error
            // })
        }
    },
    //apply to a job
    applyJob: async( req, res, next ) => {
        try{
           
            //get data from front end
            const { name, tel, email, qualifications } = req.body
            //make sure 
            if(!email || !tel || !name){
                req.flash('error', 'You must enter name, tel, and name.')
                return
            }
            //get the id
            const jobId = req.params.id
           
            //find job using id
            const job = await Job.findById(jobId)
            console.log("Here is the job", job)  

            //check if the user exists
            if(!job.applicant_emails.includes(email)){
                job.applicant_emails.unshift(email)
                job.applicants.unshift({
                    name,
                    tel,
                    email,
                    qualifications
                })
            } else {
                const email_index = job.applicant_emails.indexOf(email)

                job.applicant_emails.splice( email_index, 1 )

                job.applicants.splice( email_index, 1 )

                job.applicant_emails.unshift(email)

                job.applicants.unshift({
                    name,
                    tel,
                    email,
                    qualifications
                })
            }       

            await job.save()

            res.redirect('/jobs/read/'+jobId)

        }catch(error){
            console.log("Stupid error ", error)
        }       
    },   
    //delete a job
    deleteJob: async(req, res, next)=>{
        
        try{
           
            const result = await Job.remove({_id: req.params.id})

            if(result.ok){
                //res.render('employer/jobs/listuserjobs', { seo_info: seo_page.jobs_page_seo_info })

                return res.status(200).json({
                    "redirect":true,
                    message: "The job has been removed"
                })
               
            }

        }catch(error){
            res.status(500).json({
                message: "There has been an error deleting your job",
                error
            })
        }
    },
    //get job applicants
    getJobApplicants: async(req, res, next) => {
        
        try{            
            //const id = 
            const job = await Job.findById( req.params.job_id )
     
            //create a job post without all the job details saved in the database
            const jobPost = {
                applicants: job.applicants,
                compensation: job.compensation,
                contact: job.contact,
                description: job.description,
                location: job.location,
                requirements: job.requirements,
                schedule: job.schedule,
                title: job.title,
                name: job.name
            }
      
            if(job){
                //res.status(200).json({ jobPost })
                res.render('employer/jobs/viewapplicants', { jobPost: jobPost, seo_info: seo_page.jobs_page_seo_info })
            }
            
        }catch(error){
            console.log(error)
            res.status(500).json({
                message: "There has been an error in your request",
                error
            })
        }
    },
    //get receipt page after job post
    getPostReceipt: async (req, res) => {
        try {
            res.render('employer/jobs/checkoutreceipt', { seo_info: seo_page.jobs_page_seo_info })
        } catch (error) {
             console.log(error)
        }
    },
    //create a job
    postJob: async( req, res ) => {
        console.log( 'req object -> ', req.body )
        try{       
            
            //check to see if there's captcha
            // if (!req.body.captcha || req.body.captcha == '') {
            //     return res.json({ 
            //         success: false, 
            //         redirect: false, 
            //         url: '/job/contact', 
            //         message: 'Please select captcha' 
            //     })
            // }
                

            // Secret key
            // const secretKey = '6LdF1toZAAAAALtt_-2-UyT-3l8VPTFXgujlxYbv'

            // Verify URL
            // const query = stringify({
            //     secret: secretKey,
            //     response: req.body.captcha,
            //     remoteip: req.connection.remoteAddress
            // })

            // const verifyURL = `https://google.com/recaptcha/api/siteverify?${query}`

            // Make a request to verifyURL
            // const body = await fetch(verifyURL).then(res => res.json())

            // If not successful
            // if (body.success !== undefined && !body.success){
            //     return res.json({   
            //         success: false, 
            //         redirect: false,
            //         url: '/job',
            //         message: 'Failed captcha verification' 
            //     })
            // }
               

            // If successful
           // return res.json({ success: true, message: 'Captcha passed' })
            
            //get the job post and poster details
            const { 
                    address, compensation, description, requirements, schedule, title, 
                    facility_name, email, tel, settings
                } = req.body   

            const reimbursement = req.body.reimbursement ? req.body.reimbursement : "" 
            
            const inhouse_training = req.body.inhouse_training ? req.body.inhouse_training : ""

            // save job post in the collection
            const result = await db.collection('jobs').add({
                created : firebase.firestore.Timestamp.fromDate(new Date()),
                address, compensation, description, requirements, schedule, title,
                facility_name, email, tel, settings, reimbursement, inhouse_training
            })

            //send back           
            res.status(201).json({
                success: true,
                url: '/job/receipt',
                redirect: true,
                message: 'Your job post announcement has been successfully created!',
                id: result.id
            })       
                                                       
        }catch(error){
            console.log(error)
            res.status(500).json({                
                message: "There has been an error saving your job",
                redirect: false,
                url: '/job',
                error
            })
        }
    },       
   
     //view single job for by an employer
    viewJobById: async(req, res, next) => {
        
        try{            
            //query the job collection using id
            const jobPost = await db.collection('jobs').doc(req.params.id).get()
            //create a job post without all the job details saved in the database

            const job = jobPost.data()
            
      
            if(job){
                //res.status(200).json({ jobPost })
                res.render('employer/jobs/viewjob', { jobPost: job, seo_info: seo_page.jobs_page_seo_info })
            }
            
        }catch(error){
            res.status(500).json({
                message: "There has been an error in your request",
                error
            })
        }
    },

   

    /**
     * GET JOB PAGES
    */
   //get checkout page
    checkout: async ( req, res, next ) => {
        res.render('employer/jobs/checkout', {
            seo_info: seo_page.jobs_page_seo_info,
            STRIPE_PUBLIC_KEY: process.env.STRIPE_PUBLIC_KEY
        })
    },

    //get job posting page
    getJobPostForm: ( req, res, next ) => {
        res.render('employer/jobs/postjob', {seo_info: seo_page.jobs_page_seo_info})
    },
    //get job posting tips
    getJobPostingTips:(req, res, next) => {
        res.render('employer/jobs/jobtips', {seo_info: seo_page.jobs_page_seo_info})
    },
    //get job editing page
    getJobEditForm: async ( req, res, next ) => {
        try{            
            //const id = 
            const job = await Job.findById( req.params.id )
            //create a job post without all the job details saved in the database
            const jobPosting = {
                compensation: job.compensation,
                contact: job.contact,
                description: job.description,
                location: job.location,
                requirements: job.requirements,
                schedule: job.schedule,
                title: job.title,
                name: job.name,
                _id: job._id
            }
      
            if(job){
                //res.status(200).json({ jobPost })
                res.render('employer/jobs/editjob', { jobPosting: jobPosting, seo_info: seo_page.jobs_page_seo_info })
            }
            
        }catch(error){
            res.status(500).json({
                message: "There has been an error in your request",
                error
            })
        }

       // res.render('employer/jobs/editjob', {seo_info: seo_page.jobs_page_seo_info})
    },

    getJobPreview:  (req, res, next) => {
        res.render('employer/jobs/previewjob', {seo_info: seo_page.jobs_page_seo_info})
    },

    getJobReceipt:  (req, res, next) => {
        res.render('employer/jobs/checkoutreceipt',  {seo_info: seo_page.jobs_page_seo_info})
    },
    
    getJobContact:  (req, res, next) => {
        res.render('employer/jobs/contact',  
            {
                seo_info: seo_page.jobs_page_seo_info,
                csrfToken: req.csrfToken()
            })
    }
    
}