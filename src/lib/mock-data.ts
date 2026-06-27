import type { Task, Memory, Tool, Notification } from '@/types'

export const mockTasks: Task[] = [
  { id:'t1', goal:'Search web for latest AI news and summarize', status:'done', result:'Found 10 articles. Summary written to file.', steps:[{step:1,title:'Web Search',description:'Search for AI news',tool:'web_search',success:true,duration_ms:1200},{step:2,title:'Summarize',description:'Summarize results',success:true,duration_ms:800}], created_at:'2025-01-15T10:30:00Z', cost_usd:0.0012 },
  { id:'t2', goal:'Write a Python script to sort a list', status:'done', result:'Script written to workspace/sort_list.py', steps:[{step:1,title:'Write Code',description:'Write sorting script',success:true,duration_ms:600}], created_at:'2025-01-15T11:00:00Z', cost_usd:0.0008 },
  { id:'t3', goal:'Scrape top 5 Python libraries', status:'running', steps:[{step:1,title:'Search',description:'Search libraries',tool:'web_search',success:true,duration_ms:900},{step:2,title:'Scrape',description:'Get details',tool:'web_scrape'}], created_at:'2025-01-15T12:00:00Z' },
  { id:'t4', goal:'Analyze CSV and generate report', status:'failed', error:'File not found: data.csv', steps:[{step:1,title:'Read File',description:'Read CSV',tool:'read_file',success:false,error:'File not found'}], created_at:'2025-01-15T09:00:00Z' },
]

export const mockMemories: Memory[] = [
  { id:'m1', content:'User prefers concise answers in bullet points', type:'general', timestamp:'2025-01-14T10:00:00Z' },
  { id:'m2', content:'[SUCCESS] Goal: Search web for AI news', type:'task_episode', timestamp:'2025-01-15T10:32:00Z' },
  { id:'m3', content:'Python 3.11 is preferred for scripts', type:'general', timestamp:'2025-01-13T15:00:00Z' },
  { id:'m4', content:'Groq is fastest for general tasks', type:'general', timestamp:'2025-01-11T14:00:00Z' },
]

export const mockTools: Tool[] = [
  { name:'web_search', description:'Search the internet', category:'web', enabled:true, call_count:245, success_rate:96, avg_duration_ms:1100 },
  { name:'web_scrape', description:'Scrape webpages', category:'web', enabled:true, call_count:132, success_rate:89, avg_duration_ms:2300 },
  { name:'run_code', description:'Execute Python code', category:'code', enabled:true, call_count:198, success_rate:94, avg_duration_ms:850 },
  { name:'read_file', description:'Read files from disk', category:'file', enabled:true, call_count:87, success_rate:99, avg_duration_ms:120 },
  { name:'write_file', description:'Write files to disk', category:'file', enabled:true, call_count:76, success_rate:98, avg_duration_ms:150 },
  { name:'run_shell', description:'Run shell commands', category:'system', enabled:true, call_count:54, success_rate:87, avg_duration_ms:450 },
  { name:'calculate', description:'Math calculations', category:'code', enabled:true, call_count:34, success_rate:100, avg_duration_ms:50 },
  { name:'image_gen', description:'Generate images', category:'media', enabled:true, call_count:18, success_rate:91, avg_duration_ms:5500 },
]

export const mockNotifications: Notification[] = [
  { id:'n1', type:'success', title:'Task Completed', message:'AI news search completed successfully', timestamp:'2025-01-15T10:32:00Z', read:false },
  { id:'n2', type:'error', title:'Task Failed', message:'File not found: data.csv', timestamp:'2025-01-15T09:01:00Z', read:false },
  { id:'n3', type:'warning', title:'Budget Alert', message:'You have used 80% of your budget', timestamp:'2025-01-15T08:00:00Z', read:true },
]

export const mockAnalytics = {
  daily_tasks: [
    {date:'2025-01-09',success:8,failed:2,total:10},
    {date:'2025-01-10',success:12,failed:1,total:13},
    {date:'2025-01-11',success:6,failed:3,total:9},
    {date:'2025-01-12',success:15,failed:0,total:15},
    {date:'2025-01-13',success:10,failed:2,total:12},
    {date:'2025-01-14',success:18,failed:1,total:19},
    {date:'2025-01-15',success:9,failed:2,total:11},
  ],
  cost_over_time: [
    {date:'2025-01-09',cost:0.08},{date:'2025-01-10',cost:0.12},
    {date:'2025-01-11',cost:0.07},{date:'2025-01-12',cost:0.15},
    {date:'2025-01-13',cost:0.11},{date:'2025-01-14',cost:0.18},{date:'2025-01-15',cost:0.09},
  ],
  provider_usage: [
    {provider:'groq',calls:312,cost:0.28},{provider:'gemini',calls:145,cost:0.11},
    {provider:'deepseek',calls:89,cost:0.08},{provider:'claude',calls:42,cost:0.19},
  ],
  tool_usage: [
    {tool:'web_search',count:245,success_rate:96},{tool:'run_code',count:198,success_rate:94},
    {tool:'web_scrape',count:132,success_rate:89},{tool:'read_file',count:87,success_rate:99},
  ],
}