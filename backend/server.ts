import express from 'express'
import cors from 'cors'
import multer from 'multer'
import csvToJson from 'convert-csv-to-json'

const app = express()
const port = process.env.PORT ?? 3000

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

let userData: Array<Record<string, string>> = []

app.use(cors()) // eneable CORS

app.post('/api/files', upload.single('file'), async (req, res) => {
  // 1. Extract file
  const { file } = req
  // 2. Validate file
  if(!file) {
    return res.status(500).json({ message: 'File is required' })
  }
  // 3. Validate mimetype (csv)
  if(file.mimetype !== 'text/csv') {
    return res.status(500).json( {message: 'File must be CSV' })
  }
  let json: Array<Record<string, string>> = []
  try {
    // 4. Transform el File (buffer) to string
    const rawCsv = Buffer.from(file.buffer).toString('utf-8')
    // 5. Transform string (csv) to JSON
    json = csvToJson.fieldDelimiter(',').csvStringToJson(rawCsv)
  } catch (error) {
    return res.status(500).json({ message: 'Error parsing the file' })
  }
  
  // 6. Sabe JSON to db or memory
  userData = json
  // 7. Return 200 message and JSON
  return res.status(200).json({ data: json, message: 'File load correctly' })
})

app.post('/api/users', async (req, res) => {
  // 1. Extract param 'q'
  const { q } = req.query
  // 2. Validate param
  if(!q) return res.status(500).json({ message: 'Query param `q` must be a string' })
  if(Array.isArray(q)) return res.status(500).json({ message: 'Query param `q` is required' })
  // 3. Filter data with param
  const search = q.toString().toLowerCase()
  const filteredData = userData.filter(row => {
    return Object
      .values(row)
      .some(value => value.toLowerCase().includes(search))
  })
  // 4. Return 200 with filtered data
  res.status(200).json({ data: filteredData })
})

 app.listen(port, () => {
  console.log(`Server is running at htpps://localhost:${port}`)
 })