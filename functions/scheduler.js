const cron = require('node-cron')
const moment = require('moment')

const { notifyEmployers, notifyStudents, upcomingCoursesNotifications } = require('./helpers/notifications')


const scheduler = () => {
    return { 
        
        alertDaily: () => {
            cron.schedule('* * * * *', () => {  // '0 9 * * *'
             
               

                //console.log(`FIRST ${first}`)
                


               
                let second = first.add(8 - first.day(), 'day')
                console.log(`SECOND ${second}`)
                // notifyStudents(15) 
                // notifyEmployers(1)              
            })
        },

        alertWeekly: () => {
            cron.schedule('0 8 * * 1', () => { //'0 8 * * 1'
  
                notifyStudents(7)
                notifyEmployers(7)
            })
        },

        firstAndThirdMondayEmails: () => {
            cron.schedule("0 8 * * * ", async () => { //0 8 * * *              
                //get the first day of the month
                let first = moment().startOf('month')//.add(1, 'month');
                //get the 15th day of the month
                let third = moment().startOf('month').add(14, 'days');

                console.log(`1. Here is the first: ${first} and third: ${third}`)
                console.log(`2. Here is first Monday day # ${first.day()} and third Monday day ${third.day()}`)
                //reassign variables 
                let firstDay = first
                let fifteenthDay = third
                //if the first day or thirdt day is a Monday  
                if( first.day() === 1 || third.day() === 1 ){
                    //create first Monday
                    const firstMonday = moment( firstDay ).format('dddd') 
                    //create third Monday
                    const thirdMonday = moment( fifteenthDay ).format('dddd')                
                    //check it the name of the day of week is 'Monday'
                    if( firstMonday === 'Monday' || thirdMonday === 'Monday' ){
                        //alert the list WHCA lists
                        console.log(`Here is the day of the week.....${firstMonday}`)
                        //await alertWHCAEmployers()
                    }
                 
                }
               
                if ( first.day() > 1 || third.day() > 1) {       
                 
                    firstDay = first.add(8 - first.day(), 'day')          
                    fifteenthDay = third.add(8 - third.day(), 'day')                   
                    
                    //create first Monday
                    const firstMonday = moment(firstDay).format('dddd')
                   //create third Monday
                    const thirdMonday = moment( fifteenthDay ).format('dddd')   

                    //check of day of week
                    if( firstMonday === 'Monday' || thirdMonday === 'Monday'){
                        console.log(`5. Here is the day of the week.....${firstMonday}`)
                       // await alertWHCAEmployers()
                    }
                 
                    //send an email to employers about recruiting our past students,
                }
                if ( first.day() === 0 || third.day() === 0 ) {
                    firstDay = first.add(1, 'days')
                    fifteenthDay = third.add(1, 'days')

                    //create first Monday
                    const firstMonday = moment(firstDay).format('dddd')
                    //create third Monday
                    const thirdMonday = moment( fifteenthDay ).format('dddd')

                    if(firstMonday === 'Monday' || thirdMonday === 'Monday' ){
                        console.log(`Here is the day of the week......${firstMonday}`)
                       //await alertWHCAEmployers()
                    }
                }
            })
        },

        secondAndFourthMondayEmails: () => {
            cron.schedule("0 8 * * * ", async () => { //0 8 * * *              
                //get the seventh day of the month
                let second = moment().startOf('month').add(7, 'days');
                //get the 21st day of the month
                let fourth = moment().startOf('month').add(21, 'days')             
                //reassign variables 
                let secondDay = second
                let twentyOneDay = fourth

                //if the day # of the second Monday and fourth Monday  
                if( second.day() === 1 || fourth.day() === 1 ){
                    //create second Monday
                    const secondMonday = moment( secondDay ).format('dddd') 
                    //create fourth Monday
                    const fourthMonday = moment( twentyOneDay ).format('dddd')                
                    //check it the name of the day of week is 'Monday'
                    if( secondMonday === 'Monday' || fourthMonday === 'Monday' ){
                        //alert the list WHCA lists
                       
                        //await alertWHCAEmployers()
                    }
                 
                }
               
                if ( second.day() > 1 || fourth.day() > 1) {       
                 
                    eighthDay = second.add(8 - second.day(), 'day')          
                    twentyFirstDay = fourth.add(8 - fourth.day(), 'day')                   
                    
                    //create second Monday
                    const secondMonday = moment(eighthDay).format('dddd')
                   //create fourth Monday
                    const fourthMonday = moment( twentyFirstDay ).format('dddd')   

                    //check of day of week
                    if( secondMonday === 'Monday' || fourthMonday === 'Monday'){
                        console.log(`5. Here is the day of the week.....${firstMonday}`)
                       // await alertWHCAEmployers()
                    }
                 
                    //send an email to employers about recruiting our past students,
                }
                if ( second.day() === 0 || fourth.day() === 0 ) {

                    eighthDay = second.add(1 - second.day(), 'day')          
                    twentyFirstDay = fourth.add(1 - fourth.day(), 'day')                   
                    
                    //create second Monday
                    const secondMonday = moment(eighthDay).format('dddd')
                   //create fourth Monday
                    const fourthMonday = moment( twentyFirstDay ).format('dddd')   

                    //check of day of week
                    if( secondMonday === 'Monday' || fourthMonday === 'Monday'){
                        console.log(`5. Here is the day of the week.....${firstMonday}`)
                       // await alertWHCAEmployers()
                    }
                 
                }
            })
        }
    }
}

module.exports = scheduler()