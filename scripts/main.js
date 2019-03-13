// Single Page Application

// To be able to make cross-origin requests, what we mean by that is
// AJAX requests that are across different domains,
// we need to configure the Rails Server to accept thee requests
// As well as to run our project here with a server as well

// We will use the `http-server`
// 1. Install globally `npm i -g http-server`
// 2 Run the command in your project `http-server -p 9999`

// Requests

const BASE_URL = `http://localhost:3000/api/v1`;

// Create a module of Question related fetch request methods
const Question = {
	// fetch all questions from server
	all() {
		return fetch(`${BASE_URL}/questions`, { credentials: 'include' }).then(
			(res) => res.json(),
		);
	},
	// fetch a single question
	one(id) {
		return fetch(`${BASE_URL}/questions/${id}`, {
			credentials: 'include',
		}).then((res) => res.json());
	},
	create(params) {
		// `params` is an object that represents a question
		// { body: 'qBody', title: 'qTitle' }
		return fetch(`${BASE_URL}/questions`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		}).then((res) => res.json());
	},
	update(id, params) {
		return fetch(`${BASE_URL}/questions/${id}`, {
			method: 'PATCH',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		}).then((res) => res.json());
	},
};

// This is a helper module with methods associated with creating (and maybe later, destroying)
// a user session
const Session = {
	create(params) {
		// `params` is an object that represents a user
		// { email: 'some@email.com', password: 'some-password' }
		return fetch(`${BASE_URL}/session`, {
			method: 'POST',
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(params),
		}).then((res) => res.json());
	},
};

// Here we automatically log in our admin user
// BAD BAD BAD BAD BAD BAD!!!!!!
// THIS IAS HACKY LOG IN!
// DO NOT TRY THIS AT HOME
// DO NOT DO THIS AT WORK
// YOU MIGHT GET FIRED
Session.create({ email: 'js@winterfell.gov', password: 'supersecret' });

// Views
// rendering all questions to the DOM
function renderQuestions(questions) {
	const questionsContainer = document.querySelector('ul.question-list');
	questionsContainer.innerHTML = questions
		.map((q) => {
			return `
            <li>
                <a class="question-link" data-id="${q.id}" href="">
                    <span>${q.id} - </span>
                    ${q.title}
                </a>
            </li>
        `;
		})
		.join('');
}

// render a single question to the DOM
function renderQuestionDetails(question) {
	const questionDetailsContainer = document.querySelector('#question-show');
	const htmlString = `
        <h1>${question.title}</h1>
        <p>${question.body}</p>
        <small>Asked by: ${question.author.full_name}</small>
        <a class="link" data-target="question-edit" data-id="${
			question.id
		}" href="">Edit</a>
        <h3>Answers</h3>
        <ul>
            ${question.answers.map((a) => `<li>${a.body}</li>`).join('')}
        </ul>
    `;
	questionDetailsContainer.innerHTML = htmlString;
}

function refreshQuestions() {
	Question.all().then((questions) => renderQuestions(questions));
}

function getAndDisplayQuestion(id) {
	Question.one(id).then((question) => {
		renderQuestionDetails(question);
		navigateTo('question-show');
	});
}

function populateForm(id) {
	Question.one(id).then((question) => {
		document.querySelector('#edit-question-form [name=title]').value =
			question.title;
		document.querySelector('#edit-question-form [name=body]').value =
			question.body;
		document.querySelector('#edit-question-form [name=id]').value =
			question.id;
	});
}

// Navigation

function navigateTo(id) {
	if (id === 'question-index') {
		refreshQuestions();
	}
	document.querySelectorAll('.page').forEach((node) => {
		node.classList.remove('active');
	});
	document.querySelector(`.page#${id}`).classList.add('active');
}

// Wait for the page to load before fetching questions
document.addEventListener('DOMContentLoaded', () => {
	document.querySelector('.navbar').addEventListener('click', (event) => {
		const link = event.target.closest('[data-target]');
		if (link) {
			event.preventDefault();
			const targetPage = link.getAttribute('data-target');
			// const targetPage = link.dataset.target;
			navigateTo(targetPage);
		}
	});
	document
		.querySelector('#question-show')
		.addEventListener('click', (event) => {
			const link = event.target.closest('[data-target]');
			if (link) {
				event.preventDefault();
				populateForm(link.getAttribute('data-id'));
				const targetPage = link.getAttribute('data-target');
				// const targetPage = link.dataset.target;
				navigateTo(targetPage);
			}
		});
	// When the page loads, fetch all questions from the rails server
	// and then render then to the DOM
	refreshQuestions();
	// Add a delegated click handler to the questionsContainer
	const questionsContainer = document.querySelector('ul.question-list');
	// When something inside that container is clicked
	questionsContainer.addEventListener('click', (event) => {
		// Find the closest questionLink to whatever was actually clicked
		// within the questionContainer
		const questionLink = event.target.closest('a.question-link');
		if (questionLink) {
			// if it was, do not follow that (preventDefault)
			event.preventDefault();
			// Get the associated id for that specific question
			const { id } = questionLink.dataset;
			// fetch that question from the server
			getAndDisplayQuestion(id);
		}
	});
	const newQuestionForm = document.querySelector('#new-question-form');
	newQuestionForm.addEventListener('submit', (event) => {
		// prevents browser from submitting the form for us, as it would do by default
		event.preventDefault();
		const fD = new FormData(event.currentTarget);
		const newQuestion = {
			body: fD.get('body'),
			title: fD.get('title'),
		};
		Question.create(newQuestion).then((question) => {
			// question === { id: <q.id> }
			// clear the form
			newQuestionForm.reset();
			// fetch the question we just made
			// And display on the page
			getAndDisplayQuestion(question.id);
		});
	});
	const editQuestionForm = document.querySelector('#edit-question-form');
	editQuestionForm.addEventListener('submit', (event) => {
		// prevents browser from submitting the form for us, as it would do by default
		event.preventDefault();
		const fD = new FormData(event.currentTarget);
		const updatedQuestion = {
			body: fD.get('body'),
			title: fD.get('title'),
		};
		Question.update(fD.get('id'), updatedQuestion).then((question) => {
			// question === { id: <q.id> }
			// clear the form
			editQuestionForm.reset();
			// fetch the question we just made
			// And display on the page
			getAndDisplayQuestion(question.id);
		});
	});
});
