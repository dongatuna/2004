const cron = require('node-cron')
const moment = require('moment')

const { notifyEmployers, notifyStudents } = require('./helpers/notifications')

const scheduler = () => {
    return { 
        
        alertDaily: () => {
            cron.schedule('* * * * *', () => {  // '0 9 * * *'
             
                let monday = moment().startOf('month')
                                     .day("Monday");
                console.log(`Monday ${monday}`)
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

        // alertMonthly: () => {
        //     cron.schedule('0 9 1 * *', ()=> {

        //     })
        // }
    }
}

module.exports = scheduler()