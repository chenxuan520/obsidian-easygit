" this config is for project

" name     : the task name
" command  : the command to run
" path     : path can be termtask#Term_get_dir() stand for git,expand("%:p:h") for current dir
"            expand("%") for current buffer all path,expand("%:t") for current buffer name
"            use . can connect str
" close    : term and quickfix after command status
"            0 noclose
"            1 close
"            2 if command is not ok,will stay open,or close,
"            3 do not open first,after finish,open it,
" type     : pos of task tab or vsplit or split
" key      : key can bound map to make task run
" quickfix : default is 0(term),turn it 1 to use quick fix
" script   : pre,end script is vimscript,use | to divide
let s:root=termtask#Term_get_dir()
let s:pwd=expand('%:p:h')
let g:Term_project_task=[
			\{
			\'name'       : 'build',
			\'command'    : 'npm run build',
			\'path'       : s:root,
			\'close'      : 2,
			\'type'       : 'split',
			\'key'        : '\1',
			\'quickfix'   : 1,
			\'pre_script' : '',
			\'end_script' : '',
			\},
			\{
			\'name'       : 'run',
			\'command'    : 'cp ./manifest.json ./main.js ./styles.css /file/xiaozhu/go/src/dian/coa/demo/demo/.obsidian/plugins/obsidian-easygit/',
			\'path'       : s:root,
			\'close'      : 2,
			\'quickfix'   : 1,
			\'type'       : 'split',
			\},
			\]

