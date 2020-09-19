'use strict';

const citySelect = document.getElementById('select-cities'),
  dropdown = document.querySelector('.dropdown'),
  defaultList = dropdown.querySelector('.dropdown-lists__list--default'),
  selectList = dropdown.querySelector('.dropdown-lists__list--select'),
  autocompleteList = dropdown.querySelector('.dropdown-lists__list--autocomplete'),
  lineTemplate = document.querySelector('.js-line');

defaultList.style.display = 'none';

const sortByCount = cities => cities.sort((a, b) => b.count - a.count);

const getTop3Cities = cities => {
  sortByCount(cities);

  return cities.slice(0, 3);
};

const addLine = ({ name, count }, template, target) => {
  const line = template.content.cloneNode(true),
    lineCity = line.querySelector('.dropdown-lists__city'),
    lineCount = line.querySelector('.dropdown-lists__count');

  lineCity.textContent = name;
  lineCount.textContent = count;

  target.append(line);
};

const addCountryBlock = ({ country, count, cities }, template, target) => {
  const countryBlock = document.createElement('div'),
    countryBlockContent = template.content.cloneNode(true),
    countryBlockCity = countryBlockContent.querySelector('.dropdown-lists__city'),
    countryBlockCount = countryBlockContent.querySelector('.dropdown-lists__count');

  countryBlockCity.textContent = country;
  countryBlockCount.textContent = count;

  countryBlock.classList.add('dropdown-lists__countryBlock');
  countryBlockCity.className = 'dropdown-lists__country';
  countryBlockCity.parentNode.className = 'dropdown-lists__total-line';
  countryBlock.append(countryBlockContent);

  if (target.closest('.dropdown-lists__list--default')) {
    const bigCities = getTop3Cities(cities);
    bigCities.forEach(city => {
      addLine(city, lineTemplate, countryBlock);
    });
  } else if (target.closest('.dropdown-lists__list--select')) {
    selectList.querySelector('.dropdown-lists__col').textContent = '';
    cities.forEach(city => {
      addLine(city, lineTemplate, countryBlock);
    });
  }

  target.append(countryBlock);
};

const getCitiesData = async (url, locale = 'RU') => {
  const response = await fetch(url);

  if (!response.ok) throw new Error(response.status);

  const data = await response.json();

  data[locale].forEach(country => {
    addCountryBlock(country, lineTemplate, defaultList.querySelector('.dropdown-lists__col'));
  });

  dropdown.addEventListener('click', evt => {
    const target = evt.target;

    if (!target.closest('.dropdown-lists__total-line')) return;

    selectList.style.display = 'block';

    // Если клик по стране из списка стран с топ3 городами, то в список со всеми городами выбранной страны добавляем инфу
    if (target.closest('.dropdown-lists__list--default')) {
      data[locale].forEach(item => {
        if (item.country === target.textContent) {
          addCountryBlock(item, lineTemplate, selectList.querySelector('.dropdown-lists__col'));
        }
      });
    }

    // Если клик по стране из списка со всеми городами, то закрываем его
    if (target.closest('.dropdown-lists__list--select')) {
      selectList.style.display = '';
    }
  });

  return data;
};

citySelect.addEventListener('focus', () => {
  defaultList.style.display = '';
});

citySelect.addEventListener('input', evt => {
  autocompleteList.style.display = 'block';
  defaultList.style.display = 'none';
  selectList.style.display = '';

  if (evt.target.value === '') {
    defaultList.style.display = '';
    autocompleteList.style.display = '';
  }
});

getCitiesData('db_cities.json')
  .catch(err => console.error(err));
