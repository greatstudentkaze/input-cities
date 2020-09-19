'use strict';

const citySelect = document.getElementById('select-cities'),
  closeBtn = document.querySelector('.close-button'),
  linkBtn = document.querySelector('.input-cities .button'),
  dropdown = document.querySelector('.dropdown'),
  defaultList = dropdown.querySelector('.dropdown-lists__list--default'),
  selectList = dropdown.querySelector('.dropdown-lists__list--select'),
  autocompleteList = dropdown.querySelector('.dropdown-lists__list--autocomplete'),
  lineTemplate = document.querySelector('.js-line'),
  totalLineTemplate = document.querySelector('.js-total-line');

defaultList.style.display = 'none';

const sortByCount = cities => cities.sort((a, b) => b.count - a.count);

const getTop3Cities = cities => {
  sortByCount(cities);

  return cities.slice(0, 3);
};

const getAllCities = data => data.reduce((cities, country) => cities.concat(country.cities), []);

const getFoundCities = (cities, searchString) => {
  return cities.filter(city => {
    const cityName = city.name.toLowerCase();
    return cityName.indexOf(searchString.toLowerCase()) === 0;
  });
}

const addLine = ({ name, count }, template, target) => {
  const line = template.content.cloneNode(true),
    lineCity = line.querySelector('.dropdown-lists__city'),
    lineCount = line.querySelector('.dropdown-lists__count');

  lineCity.parentNode.dataset.city = name;
  lineCity.textContent = name;
  lineCount.textContent = count;

  target.append(line);
};

const addTotalLine = ({ country, count }, template, target) => {
  const line = template.content.cloneNode(true),
    lineCountry = line.querySelector('.dropdown-lists__country'),
    lineCount = line.querySelector('.dropdown-lists__count');

  lineCountry.textContent = country;
  lineCount.textContent = count;

  target.append(line);
};

const addCountryBlock = ({ country, count, cities }, template, target) => {
  const countryBlock = document.createElement('div');
  countryBlock.classList.add('dropdown-lists__countryBlock');
  countryBlock.dataset.country = country;

  if (country && count) {
    addTotalLine({ country, count }, totalLineTemplate, countryBlock);
  }

  if (target.closest('.dropdown-lists__list--default')) {
    cities = getTop3Cities(cities);
  } else {
    target.textContent = '';
  }

  if (cities.length > 0) {
    cities.forEach(city => {
      addLine(city, lineTemplate, countryBlock);
    });
  } else {
    const errorLine = document.createElement('div');
    errorLine.className = 'dropdown-lists__line dropdown-lists__line--error';
    errorLine.textContent = 'Ничего не найдено :(';
    countryBlock.append(errorLine);
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

  dropdown.addEventListener('click', (evt) => {
    const target = evt.target;

    if (!target.closest('.dropdown-lists__countryBlock')) return;

    const targetCountry = target.closest('.dropdown-lists__countryBlock').dataset.country;

    if (target.closest('.dropdown-lists__total-line')) {
      citySelect.value = targetCountry;

      // Если клик по стране из списка стран с топ3 городами, то в список со всеми городами выбранной страны добавляем инфу
      if (target.closest('.dropdown-lists__list--default')) {
        selectList.style.display = 'block';

        data[locale].forEach(item => {
          if (item.country === targetCountry) {
            addCountryBlock(item, lineTemplate, selectList.querySelector('.dropdown-lists__col'));
          }
        });
      }

      // Если клик по стране из списка со всеми городами, то закрываем его
      if (target.closest('.dropdown-lists__list--select')) {
        selectList.style.display = '';
      }

    } else if (target.closest('.dropdown-lists__line')) {
      const targetCity = target.closest('.dropdown-lists__line').dataset.city;
      citySelect.value = targetCity;

      const cityData = data[locale]
        .find(item => item.country === targetCountry)
        .cities.find(city => city.name === targetCity);

      linkBtn.href = cityData.link;
    }

    closeBtn.style.display = 'block';
  });

  const allCities = getAllCities(data[locale]);

  citySelect.addEventListener('input', evt => {
    const target = evt.target;

    autocompleteList.style.display = 'block';
    defaultList.style.display = 'none';
    selectList.style.display = '';
    closeBtn.style.display = 'block';
    linkBtn.removeAttribute('href');

    if (target.value === '') {
      defaultList.style.display = '';
      autocompleteList.style.display = '';
      closeBtn.style.display = '';
    }

    const foundCities = getFoundCities(allCities, target.value);
    addCountryBlock({ cities: foundCities }, lineTemplate, autocompleteList.querySelector('.dropdown-lists__col'));
  });

  return data;
};

citySelect.addEventListener('focus', () => {
  defaultList.style.display = '';
  autocompleteList.style.display = '';
});

closeBtn.addEventListener('click', () => {
  citySelect.value = '';
  closeBtn.style.display = '';
  linkBtn.removeAttribute('href');

  defaultList.style.display = 'none';
  selectList.style.display = '';
  autocompleteList.style.display = '';
});

getCitiesData('db_cities.json')
  .catch(err => console.error(err));
