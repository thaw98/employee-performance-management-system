package com.epms.backend.config;

import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * Ensures {@link UserEmployeeSchemaMigrationService} runs before Hibernate schema update.
 * Otherwise {@code ddl-auto=update} fails when altering {@code users.employee_id} while an
 * incompatible legacy FK ({@code employees.id}) still exists.
 */
@Configuration
public class UserEmployeeSchemaConfiguration {

	@Bean
	public static BeanFactoryPostProcessor entityManagerFactoryDependsOnUserEmployeeSchemaMigration() {
		return new BeanFactoryPostProcessor() {
			@Override
			public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
				if (beanFactory.containsBeanDefinition("entityManagerFactory")) {
					BeanDefinition def = beanFactory.getBeanDefinition("entityManagerFactory");
					def.setDependsOn(mergeDependsOn(def.getDependsOn(), "userEmployeeSchemaMigration"));
				}
			}
		};
	}

	private static String[] mergeDependsOn(String[] existing, String additional) {
		Set<String> merged = new LinkedHashSet<>();
		if (existing != null) {
			merged.addAll(Arrays.asList(existing));
		}
		merged.add(additional);
		return merged.toArray(new String[0]);
	}

	@Bean
	public Object userEmployeeSchemaMigration(UserEmployeeSchemaMigrationService migrationService) throws Exception {
		migrationService.migrateIfNeeded();
		return new Object();
	}
}
