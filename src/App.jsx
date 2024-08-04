import { useEffect, useState } from 'react';
import './App.css';
import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import DeleteIcon from '@mui/icons-material/Delete';

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    deleteDoc,
    setDoc,
    query,
    orderBy,
    where,
} from 'firebase/firestore';
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';

const firebaseConfig = {
    apiKey: 'AIzaSyBz1EI10cTk77wrGgJ0n9eFzjXssSmZ5I8',
    authDomain: 'todolist-test-c89c5.firebaseapp.com',
    projectId: 'todolist-test-c89c5',
    storageBucket: 'todolist-test-c89c5.appspot.com',
    messagingSenderId: '459657753874',
    appId: '1:459657753874:web:2e96142dd65fec01a12fcb',
    measurementId: 'G-S4MZTB40X0',
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
const auth = getAuth(app);

const TodoItemInputField = (props) => {
    const [input, setInput] = useState('');
    const onSubmit = () => {
        props.onSubmit(input);
        setInput('');
    };
    return (
        <Box sx={{ margin: 'auto' }}>
            <Stack direction="row" spacing={2} justifyContent="center">
                <TextField
                    id="todo-item-input"
                    label="Todo Item"
                    variant="outlined"
                    onChange={(e) => setInput(e.target.value)}
                    value={input}
                />
                <Button variant="outlined" onClick={onSubmit}>
                    Submit
                </Button>
            </Stack>
        </Box>
    );
};

const TodoItem = (props) => {
    const style = props.todoItem.isFinished ? { textDecoration: 'line-through' } : {};
    return (
        <ListItem
            secondaryAction={
                <IconButton edge="end" aria-label="comments" onClick={() => props.onRemoveClick(props.todoItem)}>
                    <DeleteIcon />
                </IconButton>
            }
        >
            <ListItemButton role={undefined} onClick={() => props.onTodoItemClick(props.todoItem)} dense>
                <ListItemIcon>
                    <Checkbox edge="start" checked={props.todoItem.isFinished} disableRipple />
                </ListItemIcon>
                <ListItemText style={style} primary={props.todoItem.todoItemContent} />
            </ListItemButton>
        </ListItem>
    );
};

const TodoItemList = (props) => {
    const todoList = props.todoItemList.map((todoItem, index) => {
        return (
            <TodoItem
                key={index}
                todoItem={todoItem}
                onTodoItemClick={props.onTodoItemClick}
                onRemoveClick={props.onRemoveClick}
            />
        );
    });
    return (
        <Box>
            <List sx={{ margin: 'auto', maxWidth: 720 }}>{todoList}</List>
        </Box>
    );
};

const TodoListAppBar = (props) => {
    const loginWithGoogleButton = (
        <Button
            color="inherit"
            onClick={() => {
                signInWithPopup(auth, provider);
            }}
        >
            Login with Google
        </Button>
    );

    const logoutButton = (
        <Button
            color="inherit"
            onClick={() => {
                signOut(auth);
            }}
        >
            Log out
        </Button>
    );

    const button = props.currentUser === null ? loginWithGoogleButton : logoutButton;

    return (
        <AppBar position="static">
            <Toolbar sx={{ width: '100%', maxWidth: 720, margin: 'auto' }}>
                <Typography variant="h6" component="div">
                    Todo List App
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {button}
            </Toolbar>
        </AppBar>
    );
};

function App() {
    const [todoItemList, setTodoItemList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            setCurrentUser(user.uid);
        } else {
            setCurrentUser(null);
        }
    });

    const syncTodoItemListStateWithFireStore = () => {
        const q = query(collection(db, 'todoItem'), where('userId', '==', currentUser), orderBy('createdTime', 'desc'));
        getDocs(q).then((querySnapShot) => {
            const fireStoreTodoItemList = [];
            querySnapShot.forEach((doc) => {
                fireStoreTodoItemList.push({
                    id: doc.id,
                    todoItemContent: doc.data().todoItemContent,
                    isFinished: doc.data().isFinished,
                    createdTime: doc.data().createdTime ?? 0,
                    userId: doc.data().userId,
                });
            });
            setTodoItemList(fireStoreTodoItemList);
        });
    };

    useEffect(() => {
        syncTodoItemListStateWithFireStore();
    }, [currentUser]);

    const onSubmit = async (newTodoItem) => {
        await addDoc(collection(db, 'todoItem'), {
            todoItemContent: newTodoItem,
            isFinished: false,
            createdTime: Math.floor(Date.now() / 1000),
            userId: currentUser,
        });

        syncTodoItemListStateWithFireStore();
    };

    const onRemoveClick = async (removedTodoItem) => {
        const todoItemRef = doc(db, 'todoItem', removedTodoItem.id);
        await deleteDoc(todoItemRef);
        syncTodoItemListStateWithFireStore();
    };

    const onTodoItemClick = async (clickedTodoItem) => {
        const todoItemRef = doc(db, 'todoItem', clickedTodoItem.id);
        await setDoc(todoItemRef, { isFinished: !clickedTodoItem.isFinished }, { merge: true });

        syncTodoItemListStateWithFireStore();
    };

    return (
        <div className="App">
            <TodoListAppBar currentUser={currentUser} />
            <Container sx={{ paddingTop: 3 }}>
                <TodoItemInputField onSubmit={onSubmit} />
                <TodoItemList
                    todoItemList={todoItemList}
                    onTodoItemClick={onTodoItemClick}
                    onRemoveClick={onRemoveClick}
                />
            </Container>
        </div>
    );
}

export default App;
